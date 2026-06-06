import Razorpay from 'razorpay';
import crypto from 'crypto';
import asyncHandler from 'express-async-handler';
import Course from '../models/Course.js';
import TestSeries from '../models/TestSeries.js';
import Enrollment from '../models/Enrollment.js';
import TestSeriesEnrollment from '../models/TestSeriesEnrollment.js';
import mongoose from 'mongoose';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import BankTransferRequest from '../models/BankTransferRequest.js';
import CoinRedemption from '../models/CoinRedemption.js';
import { generateInvoicePDF } from '../services/invoice.js';
import { sendEnrollmentEmail, sendPaymentReceiptEmail } from '../services/email.js';

/** Generate sequential invoice number */
const makeInvoiceNumber = async () => {
  const count = await Payment.countDocuments({ status: 'paid' });
  return `ACE-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
};

// Initialize Razorpay instance lazily so missing env vars don't crash the server
const getRazorpay = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error('Razorpay keys not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env');
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

// ─── Coupon validation helper ─────────────────────────────────────────────────
// Supports new discountCoupons array; falls back to legacy discountCoupon object.
const applyCoupon = (item, couponCode) => {
  const normalized = couponCode.trim().toUpperCase();

  // Build list: prefer new array, fall back to legacy single coupon
  let coupons = [];
  if (item.discountCoupons?.length) {
    coupons = item.discountCoupons;
  } else if (item.discountCoupon?.code) {
    coupons = [item.discountCoupon];
  }

  const coupon = coupons.find(
    (c) => c.isActive && c.code && c.code.trim().toUpperCase() === normalized
  );

  if (!coupon) return { valid: false, discountAmount: 0 };

  let discountAmount = 0;
  if (coupon.discountType === 'percent') {
    discountAmount = Math.round(item.price * coupon.discountValue) / 100;
  } else {
    discountAmount = coupon.discountValue;
  }
  discountAmount = Math.min(discountAmount, item.price);
  return { valid: true, discountAmount };
};

// ─── POST /api/payment/create-order ──────────────────────────────────────────
export const createOrder = asyncHandler(async (req, res) => {
  const { courseId, testSeriesId, couponCode, redeemCoins } = req.body;

  if (!courseId && !testSeriesId) {
    res.status(400);
    throw new Error('courseId or testSeriesId is required');
  }

  const isCourse = !!courseId;
  const itemType = isCourse ? 'course' : 'test_series';

  let resolvedSeriesId = testSeriesId;
  if (resolvedSeriesId && !/^[a-f\d]{24}$/i.test(resolvedSeriesId)) {
    const found = await TestSeries.findOne({ slug: resolvedSeriesId }).select('_id');
    if (found) resolvedSeriesId = found._id.toString();
  }

  let item;
  if (isCourse) {
    item = await Course.findById(courseId);
    if (!item) { res.status(404); throw new Error('Course not found'); }
    const existing = await Enrollment.findOne({ student: req.user._id, course: courseId });
    if (existing) { res.status(400); throw new Error('You are already enrolled in this course'); }
  } else {
    item = await TestSeries.findById(resolvedSeriesId);
    if (!item) { res.status(404); throw new Error('Test series not found'); }
    if (item.isFree) { res.status(400); throw new Error('This test series is free — no payment needed'); }
    const existing = await TestSeriesEnrollment.findOne({ student: req.user._id, testSeries: resolvedSeriesId });
    if (existing) { res.status(400); throw new Error('You already have access to this test series'); }
  }

  // Coupon support (courses and test series)
  const originalAmount = item.price;
  let finalAmount = originalAmount;
  let discountAmount = 0;
  let appliedCoupon = '';

  if (couponCode) {
    const result = applyCoupon(item, couponCode);
    if (!result.valid) { res.status(400); throw new Error('Invalid or inactive coupon code'); }
    discountAmount = result.discountAmount;
    finalAmount = Math.round((originalAmount - discountAmount) * 100) / 100;
    appliedCoupon = couponCode.trim().toUpperCase();
  }

  // Coin Redemption logic
  let coinsRedeemed = 0;
  let coinDiscount = 0;
  if (redeemCoins) {
    const studentUser = await User.findById(req.user._id);
    if ((studentUser.coins || 0) < 250) {
      res.status(400);
      throw new Error('Minimum 250 Ace Coins are required for redemption');
    }
    const maxCoinsNeeded = Math.floor(finalAmount * 25);
    coinsRedeemed = Math.min(studentUser.coins || 0, maxCoinsNeeded);
    coinDiscount = coinsRedeemed / 25;
    finalAmount = Math.max(0, Math.round((finalAmount - coinDiscount) * 100) / 100);
  }

  // Free path (price 0 or coupon/coin-reduced to 0)
  if (finalAmount <= 0) {
    let enrollment;
    if (isCourse) {
      enrollment = await Enrollment.create({
        student: req.user._id,
        course: courseId,
        pricePaid: 0,
        paymentId: 'FREE_' + Date.now(),
        paymentStatus: 'paid',
      });
      await Course.findByIdAndUpdate(courseId, { $inc: { studentsEnrolled: 1 } });
    } else {
      enrollment = await TestSeriesEnrollment.create({
        student: req.user._id,
        testSeries: resolvedSeriesId,
        pricePaid: 0,
        paymentId: 'FREE_' + Date.now(),
        paymentStatus: 'paid',
      });
    }

    if (coinsRedeemed > 0) {
      const studentUser = await User.findById(req.user._id);
      studentUser.coins = Math.max(0, (studentUser.coins || 0) - coinsRedeemed);
      await studentUser.save();

      await CoinRedemption.create({
        student: req.user._id,
        itemType: isCourse ? 'course' : 'test_series',
        itemId: isCourse ? courseId : resolvedSeriesId,
        itemName: item.title,
        coinsSpent: coinsRedeemed,
        discountAmount: coinDiscount,
      });
    }

    // Notify user of free enrollment
    try {
      const student = await User.findById(req.user._id).select('name email');
      if (student && student.email) {
        sendEnrollmentEmail(student.email, student.name, item.title, 0).catch(() => {});
      }
    } catch (_) {}

    return res.status(201).json({ free: true, enrollment });
  }

  // Internet handling fee: AED 45 flat if < 7300, else 0.7%
  const gatewayFee = finalAmount < 7300
    ? 45
    : Math.round(finalAmount * 0.007 * 100) / 100;
  const chargeAmount = Math.round((finalAmount + gatewayFee) * 100) / 100;

  // Create Razorpay order (amount in fils, 1 AED = 100 fils)
  const razorpay = getRazorpay();
  const itemId = isCourse ? courseId : resolvedSeriesId;
  const razorpayOrder = await razorpay.orders.create({
    amount: Math.round(chargeAmount * 100),
    currency: 'AED',
    receipt: `rcpt_${req.user._id}_${itemId}_${Date.now()}`.substring(0, 40),
    notes: {
      studentId: req.user._id.toString(),
      itemType,
      itemId: itemId.toString(),
      itemName: item.title,
    },
  });

  const payment = await Payment.create({
    student: req.user._id,
    itemType,
    course: isCourse ? courseId : null,
    testSeries: isCourse ? null : resolvedSeriesId,
    razorpayOrderId: razorpayOrder.id,
    amount: chargeAmount,
    originalAmount,
    couponCode: appliedCoupon,
    discountAmount,
    coinsRedeemed,
    coinDiscount,
    status: 'created',
  });

  res.status(201).json({
    free: false,
    orderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
    paymentDbId: payment._id,
    baseAmount: finalAmount,
    gatewayFee,
    totalAmount: chargeAmount,
    prefill: {
      name: req.user.name,
      email: req.user.email,
      contact: req.user.phone || '',
    },
    itemName: item.title,
    itemThumbnail: item.thumbnail || '',
    itemType,
  });
});

// ─── POST /api/payment/verify ─────────────────────────────────────────────────
export const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, courseId, testSeriesId } = req.body;

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    res.status(400);
    throw new Error('razorpayOrderId, razorpayPaymentId and razorpaySignature are required');
  }
  if (!courseId && !testSeriesId) {
    res.status(400);
    throw new Error('courseId or testSeriesId is required');
  }

  const payment = await Payment.findOne({
    razorpayOrderId,
    student: req.user._id,
    status: 'created',
  });
  if (!payment) {
    res.status(404);
    throw new Error('Payment record not found or already processed');
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) { res.status(500); throw new Error('Razorpay key secret not configured'); }

  const expectedSig = crypto
    .createHmac('sha256', keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  if (expectedSig !== razorpaySignature) {
    payment.status = 'failed';
    await payment.save();
    res.status(400);
    throw new Error('Payment verification failed: invalid signature');
  }

  let enrollment;
  if (courseId) {
    const already = await Enrollment.findOne({ student: req.user._id, course: courseId });
    enrollment = already || await Enrollment.create({
      student: req.user._id,
      course: courseId,
      pricePaid: payment.amount,
      paymentId: razorpayPaymentId,
      paymentStatus: 'paid',
    });
    if (!already) await Course.findByIdAndUpdate(courseId, { $inc: { studentsEnrolled: 1 } });
  } else {
    const already = await TestSeriesEnrollment.findOne({ student: req.user._id, testSeries: testSeriesId });
    enrollment = already || await TestSeriesEnrollment.create({
      student: req.user._id,
      testSeries: testSeriesId,
      pricePaid: payment.amount,
      paymentId: razorpayPaymentId,
      paymentStatus: 'paid',
    });
  }

  payment.razorpayPaymentId = razorpayPaymentId;
  payment.razorpaySignature = razorpaySignature;
  payment.status = 'paid';

  // Deduct coins if redeemed on checkout
  if (payment.coinsRedeemed > 0) {
    const studentUser = await User.findById(req.user._id);
    studentUser.coins = Math.max(0, (studentUser.coins || 0) - payment.coinsRedeemed);
    await studentUser.save();

    const itemDoc = courseId
      ? await Course.findById(courseId).select('title')
      : await TestSeries.findById(testSeriesId).select('title');
    const itemName = itemDoc?.title || 'Purchased Item';

    await CoinRedemption.create({
      student: req.user._id,
      itemType: payment.itemType,
      itemId: courseId || testSeriesId,
      itemName: itemName,
      coinsSpent: payment.coinsRedeemed,
      discountAmount: payment.coinDiscount,
    });
  }

  // Generate invoice number
  const invoiceNumber = await makeInvoiceNumber();
  payment.invoiceNumber = invoiceNumber;
  payment.invoiceGeneratedAt = new Date();
  await payment.save();

  // Send confirmation email + receipt (async, don't block response)
  try {
    const student = await User.findById(req.user._id).select('name email studentId');
    const itemDoc = courseId
      ? await Course.findById(courseId).select('title')
      : await TestSeries.findById(testSeriesId).select('title');
    const itemName = itemDoc?.title || 'Course';

    const pdfBuffer = await generateInvoicePDF({
      invoiceNumber,
      invoiceDate: payment.invoiceGeneratedAt,
      studentName: student.name,
      studentEmail: student.email,
      studentId: student.studentId || '',
      itemName,
      itemType: payment.itemType,
      originalAmount: payment.originalAmount,
      discountAmount: payment.discountAmount,
      finalAmount: payment.amount,
      razorpayPaymentId,
      couponCode: payment.couponCode,
    });

    sendEnrollmentEmail(student.email, student.name, itemName, payment.amount).catch(() => {});
    sendPaymentReceiptEmail(student.email, student.name, {
      invoiceNumber,
      invoiceDate: payment.invoiceGeneratedAt,
      itemName,
      itemType: payment.itemType,
      originalAmount: payment.originalAmount,
      discountAmount: payment.discountAmount,
      finalAmount: payment.amount,
      razorpayPaymentId,
      couponCode: payment.couponCode,
    }, pdfBuffer).catch(() => {});
  } catch (_) { /* email errors must not break flow */ }

  res.json({ success: true, enrollment, invoiceNumber });
});

// ─── POST /api/payment/validate-coupon ───────────────────────────────────────
export const validateCoupon = asyncHandler(async (req, res) => {
  const { courseId, testSeriesId, couponCode } = req.body;
  if ((!courseId && !testSeriesId) || !couponCode) {
    res.status(400); throw new Error('courseId or testSeriesId, and couponCode are required');
  }

  let resolvedSeriesId = testSeriesId;
  if (resolvedSeriesId && !/^[a-f\d]{24}$/i.test(resolvedSeriesId)) {
    const found = await TestSeries.findOne({ slug: resolvedSeriesId }).select('_id');
    if (found) resolvedSeriesId = found._id.toString();
  }

  let item;
  if (courseId) {
    item = await Course.findById(courseId);
    if (!item) { res.status(404); throw new Error('Course not found'); }
  } else {
    item = await TestSeries.findById(resolvedSeriesId);
    if (!item) { res.status(404); throw new Error('Test series not found'); }
  }

  const result = applyCoupon(item, couponCode);
  if (!result.valid) { res.status(400); throw new Error('Invalid or inactive coupon code'); }

  res.json({
    valid: true,
    couponCode: couponCode.trim().toUpperCase(),
    originalAmount: item.price,
    discountAmount: result.discountAmount,
    finalAmount: Math.round((item.price - result.discountAmount) * 100) / 100,
  });
});

// ─── GET /api/payment/check-series/:testSeriesId ──────────────────────────────
export const checkSeriesEnrollment = asyncHandler(async (req, res) => {
  let resolvedSeriesId = req.params.testSeriesId;
  if (resolvedSeriesId && !/^[a-f\d]{24}$/i.test(resolvedSeriesId)) {
    const found = await TestSeries.findOne({ slug: resolvedSeriesId }).select('_id');
    if (found) resolvedSeriesId = found._id.toString();
  }

  // 1. Check direct enrollment
  let exists = await TestSeriesEnrollment.findOne({
    student: req.user._id,
    testSeries: resolvedSeriesId,
  });

  // 2. Check if student is enrolled in a course containing this test series
  if (!exists) {
    const enrollments = await Enrollment.find({ student: req.user._id }).select('course');
    const courseIds = enrollments.map((e) => e.course);
    if (courseIds.length > 0) {
      const courseWithSeries = await Course.findOne({
        _id: { $in: courseIds },
        testSeries: resolvedSeriesId,
      });
      if (courseWithSeries) {
        exists = true;
      }
    }
  }

  res.json({ enrolled: !!exists });
});

// ─── GET /api/payment/my-series ───────────────────────────────────────────────
export const mySeriesEnrollments = asyncHandler(async (req, res) => {
  const list = await TestSeriesEnrollment.find({ student: req.user._id })
    .populate('testSeries')
    .sort({ createdAt: -1 });
  res.json(list);
});

// ─── ADMIN: GET /api/payment/admin/all ───────────────────────────────────────
export const adminListPayments = asyncHandler(async (_req, res) => {
  const payments = await Payment.find()
    .populate('student', 'name email studentId')
    .populate('course', 'title price')
    .populate('testSeries', 'title price')
    .sort({ createdAt: -1 })
    .limit(500);
  res.json(payments);
});

// ─── GET /api/payment/invoice/:paymentId ─────────────────────────────────────
export const downloadInvoice = asyncHandler(async (req, res) => {
  const paymentIdParam = req.params.paymentId;

  let payment = null;
  let bankRequest = null;

  // 1. Try to find in Payment using _id or razorpayPaymentId
  if (mongoose.isValidObjectId(paymentIdParam)) {
    payment = await Payment.findOne({ _id: paymentIdParam, student: req.user._id, status: 'paid' })
      .populate('course', 'title')
      .populate('testSeries', 'title');
  }

  if (!payment) {
    payment = await Payment.findOne({ razorpayPaymentId: paymentIdParam, student: req.user._id, status: 'paid' })
      .populate('course', 'title')
      .populate('testSeries', 'title');
  }

  // 2. If not found in Payment, check if it's a Bank Transfer Request
  if (!payment) {
    let searchId = paymentIdParam;
    if (paymentIdParam.startsWith('BANK_')) {
      searchId = paymentIdParam.replace('BANK_', '');
    }
    if (mongoose.isValidObjectId(searchId)) {
      bankRequest = await BankTransferRequest.findOne({ _id: searchId, student: req.user._id, status: 'confirmed' })
        .populate('course', 'title')
        .populate('testSeries', 'title');
    }
  }

  if (!payment && !bankRequest) {
    res.status(404);
    throw new Error('Invoice not found');
  }

  const student = await User.findById(req.user._id).select('name email studentId');

  let pdfBuffer;
  if (payment) {
    const itemDoc = payment.course || payment.testSeries;
    pdfBuffer = await generateInvoicePDF({
      invoiceNumber: payment.invoiceNumber || `ACE-${payment._id.toString().slice(-8).toUpperCase()}`,
      invoiceDate: payment.invoiceGeneratedAt || payment.updatedAt,
      studentName: student.name,
      studentEmail: student.email,
      studentId: student.studentId || '',
      itemName: itemDoc?.title || 'Course',
      itemType: payment.itemType,
      originalAmount: payment.originalAmount || payment.amount,
      discountAmount: payment.discountAmount || 0,
      finalAmount: payment.amount,
      razorpayPaymentId: payment.razorpayPaymentId || 'N/A',
      couponCode: payment.couponCode,
    });
  } else {
    const itemDoc = bankRequest.course || bankRequest.testSeries;
    pdfBuffer = await generateInvoicePDF({
      invoiceNumber: `ACE-BANK-${bankRequest._id.toString().slice(-8).toUpperCase()}`,
      invoiceDate: bankRequest.confirmedAt || bankRequest.updatedAt,
      studentName: student.name,
      studentEmail: student.email,
      studentId: student.studentId || '',
      itemName: itemDoc?.title || 'Course',
      itemType: bankRequest.itemType,
      originalAmount: bankRequest.baseAmount,
      discountAmount: bankRequest.coinDiscount || 0,
      finalAmount: bankRequest.totalAmount,
      razorpayPaymentId: bankRequest.referenceNumber || 'BANK-TRANSFER',
      couponCode: '',
    });
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="invoice-${payment?.invoiceNumber || bankRequest?._id || paymentIdParam}.pdf"`);
  res.send(pdfBuffer);
});
