import asyncHandler from 'express-async-handler';
import CoinPurchaseRequest from '../models/CoinPurchaseRequest.js';
import User from '../models/User.js';

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
