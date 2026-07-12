import asyncHandler from 'express-async-handler';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import CoinPurchaseRequest from '../models/CoinPurchaseRequest.js';
import User from '../models/User.js';
import { generateInvoicePDF } from '../services/invoice.js';

const getCoinPurchaseBreakdown = (coins) => {
  const paidCoins = Number(coins);
  const bonusCoins = paidCoins === 500 ? 50 : paidCoins === 1000 ? 80 : 0;
  return {
    paidCoins,
    bonusCoins,
    coinsToCredit: paidCoins + bonusCoins,
  };
};

// @desc    Submit a coin purchase request (Student)
// @route   POST /api/coin-purchase
// @access  Private
export const submitCoinPurchase = asyncHandler(async (req, res) => {
  const {
    coinsRequested,
    amountPaid,
    studentName,
    studentPhone,
    studentEmail,
    referenceNumber,
    screenshotUrl,
    notes,
  } = req.body;

  if (!coinsRequested || !amountPaid) {
    res.status(400);
    throw new Error('Coins requested and amount paid are required');
  }

  if (Number(coinsRequested) <= 0 || Number(amountPaid) <= 0) {
    res.status(400);
    throw new Error('Coins and amount must be positive numbers');
  }

  const doc = await CoinPurchaseRequest.create({
    student: req.user._id,
    coinsRequested: Number(coinsRequested),
    amountPaid: Number(amountPaid),
    studentName: studentName || req.user.name,
    studentPhone: studentPhone || req.user.phone || '',
    studentEmail: studentEmail || req.user.email || '',
    referenceNumber: referenceNumber || '',
    screenshotUrl: screenshotUrl || '',
    notes: notes || '',
    status: 'pending',
  });

  res.status(201).json(doc);
});

// @desc    Update screenshot or reference number on existing pending request (Student)
// @route   PUT /api/coin-purchase/:id
// @access  Private
export const updateCoinPurchase = asyncHandler(async (req, res) => {
  const request = await CoinPurchaseRequest.findOne({
    _id: req.params.id,
    student: req.user._id,
    status: 'pending',
  });

  if (!request) {
    res.status(404);
    throw new Error('Request not found or already processed');
  }

  const { referenceNumber, screenshotUrl, notes, studentName, studentPhone } = req.body;

  if (referenceNumber !== undefined) request.referenceNumber = referenceNumber;
  if (screenshotUrl !== undefined) request.screenshotUrl = screenshotUrl;
  if (notes !== undefined) request.notes = notes;
  if (studentName !== undefined) request.studentName = studentName;
  if (studentPhone !== undefined) request.studentPhone = studentPhone;

  await request.save();
  res.json(request);
});

// @desc    Get my coin purchase requests (Student)
// @route   GET /api/coin-purchase/me
// @access  Private
export const myCoinPurchases = asyncHandler(async (req, res) => {
  const list = await CoinPurchaseRequest.find({ student: req.user._id })
    .sort({ createdAt: -1 });
  res.json(list);
});

// @desc    List all coin purchase requests (Admin)
// @route   GET /api/coin-purchase/admin
// @access  Private/Admin
export const adminListCoinPurchases = asyncHandler(async (req, res) => {
  const list = await CoinPurchaseRequest.find()
    .populate('student', 'name email phone studentId')
    .sort({ createdAt: -1 });
  res.json(list);
});

// @desc    Approve a coin purchase request & credit coins (Admin)
// @route   POST /api/coin-purchase/admin/:id/approve
// @access  Private/Admin
export const adminApproveCoinPurchase = asyncHandler(async (req, res) => {
  const request = await CoinPurchaseRequest.findById(req.params.id);

  if (!request) {
    res.status(404);
    throw new Error('Request not found');
  }

  if (request.status !== 'pending') {
    res.status(400);
    throw new Error('Request has already been processed');
  }

  const studentUser = await User.findById(request.student);
  if (!studentUser) {
    res.status(404);
    throw new Error('Student user not found');
  }

  // Credit the coins to student
  studentUser.coins = (studentUser.coins || 0) + request.coinsRequested;
  await studentUser.save();

  // Update request details
  request.status = 'approved';
  request.adminNote = req.body.adminNote || '';
  request.processedAt = new Date();
  request.processedBy = req.user._id;
  await request.save();

  res.json({
    message: 'Request approved and coins credited successfully',
    request,
  });
});

// @desc    Reject a coin purchase request (Admin)
// @route   POST /api/coin-purchase/admin/:id/reject
// @access  Private/Admin
export const adminRejectCoinPurchase = asyncHandler(async (req, res) => {
  const request = await CoinPurchaseRequest.findById(req.params.id);

  if (!request) {
    res.status(404);
    throw new Error('Request not found');
  }

  if (request.status !== 'pending') {
    res.status(400);
    throw new Error('Request has already been processed');
  }

  // Update request details
  request.status = 'rejected';
  request.adminNote = req.body.adminNote || '';
  request.processedAt = new Date();
  request.processedBy = req.user._id;
  await request.save();

  res.json({
    message: 'Request rejected successfully',
    request,
  });
});

// ─── Razorpay: Create order for coin purchase ────────────────────────────────
// @desc    Create a Razorpay order for buying Ace Coins
// @route   POST /api/coin-purchase/razorpay/create-order
// @access  Private
export const createCoinRazorpayOrder = asyncHandler(async (req, res) => {
  const { coins } = req.body;
  const { paidCoins, bonusCoins, coinsToCredit } = getCoinPurchaseBreakdown(coins);

  if (!Number.isFinite(paidCoins) || paidCoins < 50) {
    res.status(400);
    throw new Error('Minimum 50 coins required');
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    res.status(500);
    throw new Error('Razorpay keys not configured');
  }

  const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
  const amountPaise = paidCoins * 100; // 1 coin = ₹1 = 100 paise

  const order = await razorpay.orders.create({
    amount: amountPaise,
    currency: 'INR',
    receipt: `coins_${req.user._id}_${Date.now()}`.substring(0, 40),
    notes: {
      userId: req.user._id.toString(),
      coinsPaid: String(paidCoins),
      bonusCoins: String(bonusCoins),
      coinsToCredit: String(coinsToCredit),
    },
  });

  await CoinPurchaseRequest.create({
    student: req.user._id,
    coinsRequested: coinsToCredit,
    amountPaid: paidCoins,
    studentName: req.user.name || 'Student',
    studentPhone: req.user.phone || 'N/A',
    studentEmail: req.user.email || 'N/A',
    referenceNumber: order.id,
    paymentMethod: 'razorpay',
    paymentGateway: 'Razorpay',
    razorpayOrderId: order.id,
    paidCoins,
    bonusCoins,
    notes: `Razorpay order created for ${coinsToCredit} coins${bonusCoins ? ` (${paidCoins} paid + ${bonusCoins} bonus)` : ''}`,
    status: 'pending',
  });

  res.json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId,
    coins: coinsToCredit,
    paidCoins,
    bonusCoins,
    prefill: {
      name: req.user.name || '',
      email: req.user.email || '',
      contact: req.user.phone || '',
    },
  });
});

// ─── Razorpay: Verify payment & credit coins ─────────────────────────────────
// @desc    Verify Razorpay payment and credit coins to user
// @route   POST /api/coin-purchase/razorpay/verify
// @access  Private
export const verifyCoinRazorpayPayment = asyncHandler(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    res.status(400);
    throw new Error('Missing payment details');
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    res.status(500);
    throw new Error('Razorpay keys not configured');
  }

  // Verify signature
  const body = razorpayOrderId + '|' + razorpayPaymentId;
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(body)
    .digest('hex');

  if (expectedSignature !== razorpaySignature) {
    res.status(400);
    throw new Error('Payment verification failed: invalid signature');
  }

  const existingPurchase = await CoinPurchaseRequest.findOne({
    student: req.user._id,
    $or: [
      { razorpayPaymentId },
      { referenceNumber: razorpayPaymentId },
    ],
    status: 'approved',
  });

  if (existingPurchase) {
    const user = await User.findById(req.user._id).select('coins');
    return res.json({
      success: true,
      coinsAdded: 0,
      totalCoins: user?.coins || 0,
      message: 'This payment has already been credited.',
    });
  }

  const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
  const order = await razorpay.orders.fetch(razorpayOrderId);
  const orderUserId = order?.notes?.userId;

  if (orderUserId && orderUserId !== req.user._id.toString()) {
    res.status(400);
    throw new Error('Payment order does not belong to this account');
  }

  const paidCoinsFromOrder = Number(order?.notes?.coinsPaid || Number(order?.amount || 0) / 100);
  const { paidCoins, bonusCoins, coinsToCredit } = getCoinPurchaseBreakdown(paidCoinsFromOrder);

  if (!Number.isFinite(paidCoins) || paidCoins < 50 || Number(order?.amount) !== paidCoins * 100) {
    res.status(400);
    throw new Error('Payment amount could not be verified');
  }

  let purchase = await CoinPurchaseRequest.findOne({
    student: req.user._id,
    razorpayOrderId,
  });

  if (purchase?.status === 'approved') {
    const user = await User.findById(req.user._id).select('coins');
    return res.json({
      success: true,
      coinsAdded: 0,
      totalCoins: user?.coins || 0,
      message: 'This payment has already been credited.',
    });
  }

  // Credit coins to user
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  user.coins = (user.coins || 0) + coinsToCredit;
  await user.save();

  const purchaseUpdate = {
    coinsRequested: coinsToCredit,
    amountPaid: paidCoins,
    studentName: req.user.name || 'Student',
    studentPhone: req.user.phone || 'N/A',
    studentEmail: req.user.email || 'N/A',
    referenceNumber: razorpayPaymentId,
    paymentMethod: 'razorpay',
    paymentGateway: 'Razorpay',
    razorpayOrderId,
    razorpayPaymentId,
    paidCoins,
    bonusCoins,
    notes: `Razorpay payment successful${bonusCoins ? ` (${paidCoins} paid + ${bonusCoins} bonus)` : ''}`,
    status: 'approved',
    processedAt: new Date(),
  };

  if (purchase) {
    Object.assign(purchase, purchaseUpdate);
    await purchase.save();
  } else {
    purchase = await CoinPurchaseRequest.create({
      student: req.user._id,
      ...purchaseUpdate,
    });
  }

  res.json({
    success: true,
    coinsAdded: coinsToCredit,
    paidCoins,
    bonusCoins,
    totalCoins: user.coins,
    message: `${coinsToCredit} Ace Coins credited to your account!`,
  });
});

// @desc    Download invoice for an approved Ace Coins purchase
// @route   GET /api/coin-purchase/invoice/:id
// @access  Private
export const downloadCoinPurchaseInvoice = asyncHandler(async (req, res) => {
  const purchase = await CoinPurchaseRequest.findOne({
    _id: req.params.id,
    student: req.user._id,
    status: 'approved',
  });

  if (!purchase) {
    res.status(404);
    throw new Error('Coin purchase invoice not found');
  }

  const student = await User.findById(req.user._id).select('name email studentId');
  const invoiceNumber = `ACE-COIN-${purchase._id.toString().slice(-8).toUpperCase()}`;
  const paidCoins = purchase.paidCoins || purchase.amountPaid || purchase.coinsRequested || 0;
  const bonusCoins = purchase.bonusCoins || Math.max(0, (purchase.coinsRequested || 0) - paidCoins);

  const pdfBuffer = await generateInvoicePDF({
    invoiceNumber,
    invoiceDate: purchase.processedAt || purchase.updatedAt || purchase.createdAt,
    studentName: student?.name || purchase.studentName || 'Student',
    studentEmail: student?.email || purchase.studentEmail || '',
    studentId: student?.studentId || '',
    itemName: `${purchase.coinsRequested} Ace Coins${bonusCoins ? ` (${paidCoins} paid + ${bonusCoins} bonus)` : ''}`,
    itemType: 'coin_purchase',
    originalAmount: paidCoins,
    discountAmount: 0,
    finalAmount: purchase.amountPaid || paidCoins,
    razorpayPaymentId: purchase.razorpayPaymentId || purchase.referenceNumber || 'ADMIN-APPROVED',
    couponCode: '',
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoiceNumber}.pdf"`);
  res.send(pdfBuffer);
});
