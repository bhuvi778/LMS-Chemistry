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

const calculateValidityEndDate = (validitySystem) => {
  if (!validitySystem || validitySystem.type === 'lifetime') return null;
  if (validitySystem.type === 'endDate') return validitySystem.endDate;
  if (validitySystem.type === 'duration') {
    const d = new Date();
    const val = validitySystem.durationValue || 0;
    const unit = validitySystem.durationUnit || 'months';
    if (unit === 'days') d.setDate(d.getDate() + val);
    else if (unit === 'months') d.setMonth(d.getMonth() + val);
    else if (unit === 'years') d.setFullYear(d.getFullYear() + val);
    return d;
  }
  return null;
};

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
// Checks global maxUses and per-user maxUsesPerUser limits.
const findAndValidateCoupon = async (item, couponCode, basePrice, userId) => {
  const priceToUse = basePrice !== undefined ? basePrice : item.price;
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

  if (!coupon) {
    return { valid: false, error: 'Invalid or inactive coupon code' };
  }

  // Check usage limits
  const Payment = mongoose.model('Payment');
  if (coupon.maxUses > 0) {
    const globalUses = await Payment.countDocuments({
      status: 'paid',
      couponCode: normalized,
      $or: [
        { course: item._id },
        { testSeries: item._id }
      ]
    });
    if (globalUses >= coupon.maxUses) {
      return { valid: false, error: 'This coupon has reached its maximum usage limit' };
    }
  }

  if (coupon.maxUsesPerUser > 0) {
    const userUses = await Payment.countDocuments({
      student: userId,
      status: 'paid',
      couponCode: normalized,
      $or: [
        { course: item._id },
        { testSeries: item._id }
      ]
    });
    if (userUses >= coupon.maxUsesPerUser) {
      return { valid: false, error: 'You have already used this coupon' };
    }
  }

  let discountAmount = 0;
  if (coupon.discountType === 'percent') {
    discountAmount = Math.round(priceToUse * coupon.discountValue) / 100;
  } else {
    discountAmount = coupon.discountValue;
  }
  discountAmount = Math.min(discountAmount, priceToUse);
  return { valid: true, discountAmount };
};

/** Helper to calculate prorated upgrade credit & new amount */
const calculateUpgradeDetails = (newPlanPrice, existingEnrollment, courseObj) => {
  if (!existingEnrollment) return { credit: 0, upgradeFee: newPlanPrice };

  let oldPrice = existingEnrollment.pricePaid || 0;
  
  // Fallback for legacy/manual enrollments where pricePaid was stored as 0
  if (oldPrice === 0 && courseObj) {
    const oldPlan = existingEnrollment.planType || 'batch';
    if (courseObj.plans && courseObj.plans[oldPlan] && courseObj.plans[oldPlan].price > 0) {
      oldPrice = courseObj.plans[oldPlan].price;
    } else {
      if (oldPlan === 'batch') oldPrice = courseObj.price || 0;
      else if (oldPlan === 'pro') oldPrice = Math.round((courseObj.price || 0) * 1.25);
      else if (oldPlan === 'infinity') oldPrice = Math.round((courseObj.price || 0) * 1.5);
    }
  }

  let credit = 0;
  if (existingEnrollment.validUntil) {
    const startDate = existingEnrollment.createdAt || new Date();
    const totalMs = new Date(existingEnrollment.validUntil) - new Date(startDate);
    const remainingMs = new Date(existingEnrollment.validUntil) - new Date();

    if (totalMs > 0 && remainingMs > 0) {
      credit = oldPrice * (remainingMs / totalMs);
    }
  } else {
    // If lifetime (validUntil is null), credit is equal to the full pricePaid
    credit = oldPrice;
  }

  // Round credit to 2 decimal places
  credit = Math.round(credit * 100) / 100;
  
  // Upgrade Fee = NP - Credit
  const upgradeFee = Math.max(0, Math.round((newPlanPrice - credit) * 100) / 100);

  return { credit, upgradeFee };
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
  let planType = req.body.planType || 'batch';
  if (isCourse && !['batch', 'pro', 'infinity'].includes(planType)) {
    planType = 'batch';
  }

  if (isCourse) {
    item = await Course.findById(courseId);
    if (!item) { res.status(404); throw new Error('Course not found'); }
    if (item.isAdmissionClosed) {
      res.status(400);
      throw new Error('This batch admission has been closed.');
    }
    const existing = await Enrollment.findOne({ student: req.user._id, course: courseId });
    if (req.body.isExtension) {
      if (!item.allowExtendValidity) {
        res.status(400);
        throw new Error('Validity extension is not allowed for this course');
      }
      if (!existing) {
        res.status(400);
        throw new Error('You must be enrolled in this course to extend its validity');
      }
    } else {
      if (existing) {
        const planOrder = { batch: 1, pro: 2, infinity: 3 };
        if (planOrder[planType] <= planOrder[existing.planType]) {
          res.status(400);
          throw new Error(`You are already enrolled in the ${existing.planType.toUpperCase()} plan. Downgrade or same-plan upgrade is not allowed.`);
        }
      }
    }

    // Seat limit check for Ace Infinity
    if (!req.body.isExtension && planType === 'infinity') {
      const seatsLimit = item.plans?.infinity?.seatsLimit || 15;
      const seatsReserved = item.plans?.infinity?.seatsReserved || 0;
      const enrolledInfinityCount = await Enrollment.countDocuments({
        course: courseId,
        planType: 'infinity',
      });
      const remainingSeats = seatsLimit - seatsReserved - enrolledInfinityCount;
      if (remainingSeats <= 0) {
        res.status(400);
        throw new Error('Ace Infinity plan seats are completely full (Sold Out)!');
      }
    }
  } else {
    item = await TestSeries.findById(resolvedSeriesId);
    if (!item) { res.status(404); throw new Error('Test series not found'); }
    if (item.isFree) { res.status(400); throw new Error('This test series is free — no payment needed'); }
    const existing = await TestSeriesEnrollment.findOne({ student: req.user._id, testSeries: resolvedSeriesId });
    if (existing) { res.status(400); throw new Error('You already have access to this test series'); }
  }

  // Coupon support (courses and test series)
  let originalAmount = 0;
  if (req.body.isExtension) {
    originalAmount = item.extendValidityPrice || 0;
  } else if (isCourse) {
    if (item.isPowerCourse) {
      originalAmount = item.price || 0;
    } else if (item.plans && item.plans[planType] && item.plans[planType].price > 0) {
      const pConfig = item.plans[planType];
      if (!pConfig.enabled) {
        res.status(400);
        throw new Error(`The selected plan "${planType}" is not enabled for this course`);
      }
      originalAmount = pConfig.price;
    } else {
      // Fallback
      originalAmount = item.price || 0;
      if (planType === 'pro') {
        originalAmount = Math.round(originalAmount * 1.25);
      } else if (planType === 'infinity') {
        originalAmount = Math.round(originalAmount * 1.5);
      }
    }
  } else {
    originalAmount = item.price || 0;
  }

  // Adjust price if upgrading
  if (isCourse && !req.body.isExtension) {
    const existing = await Enrollment.findOne({ student: req.user._id, course: courseId });
    if (existing) {
      const details = calculateUpgradeDetails(originalAmount, existing, item);
      originalAmount = details.upgradeFee;
    }
  }

  let finalAmount = originalAmount;
  let discountAmount = 0;
  let appliedCoupon = '';

  if (couponCode) {
    const result = await findAndValidateCoupon(item, couponCode, originalAmount, req.user._id);
    if (!result.valid) { res.status(400); throw new Error(result.error || 'Invalid or inactive coupon code'); }
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
    const maxCoinsNeeded = Math.floor(finalAmount);
    coinsRedeemed = Math.min(studentUser.coins || 0, maxCoinsNeeded);
    coinDiscount = coinsRedeemed;
    finalAmount = Math.max(0, Math.round((finalAmount - coinDiscount) * 100) / 100);
  }

  // Free path (price 0 or coupon/coin-reduced to 0)
  if (finalAmount <= 0) {
    let enrollment;
    if (isCourse) {
      const existing = await Enrollment.findOne({ student: req.user._id, course: courseId });
      if (req.body.isExtension) {
        if (!existing) {
          res.status(400);
          throw new Error('Enrollment not found for validity extension');
        }
        const val = item.extendValidityDurationValue || 1;
        const unit = item.extendValidityDurationUnit || 'months';
        let baseDate = new Date();
        if (existing.validUntil && new Date(existing.validUntil) > new Date()) {
          baseDate = new Date(existing.validUntil);
        }
        if (unit === 'days') baseDate.setDate(baseDate.getDate() + val);
        else if (unit === 'months') baseDate.setMonth(baseDate.getMonth() + val);
        else if (unit === 'years') baseDate.setFullYear(baseDate.getFullYear() + val);

        existing.validUntil = baseDate;
        existing.pricePaid = (existing.pricePaid || 0) + finalAmount;
        existing.paymentId = 'FREE_EXTENSION_' + Date.now();
        await existing.save();
        enrollment = existing;
      } else if (existing) {
        // Calculate remaining credit from the old pricePaid
        const details = calculateUpgradeDetails(0, existing, item);
        existing.planType = planType;
        existing.pricePaid = Math.round((details.credit + finalAmount) * 100) / 100;
        existing.paymentId = 'FREE_UPGRADE_' + Date.now();
        existing.validUntil = calculateValidityEndDate(item.validity);
        existing.createdAt = new Date();
        await existing.save();
        enrollment = existing;
      } else {
        enrollment = await Enrollment.create({
          student: req.user._id,
          course: courseId,
          planType: planType,
          pricePaid: 0,
          paymentId: 'FREE_' + Date.now(),
          paymentStatus: 'paid',
          validUntil: calculateValidityEndDate(item.validity),
        });
        await Course.findByIdAndUpdate(courseId, { $inc: { studentsEnrolled: 1 } });
      }
    } else {
      enrollment = await TestSeriesEnrollment.create({
        student: req.user._id,
        testSeries: resolvedSeriesId,
        pricePaid: 0,
        paymentId: 'FREE_' + Date.now(),
        paymentStatus: 'paid',
        validUntil: calculateValidityEndDate(item.validity),
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

  // Internet handling fee: flat 3%
  const gatewayFee = Math.round(finalAmount * 0.03 * 100) / 100;
  const chargeAmount = Math.round((finalAmount + gatewayFee) * 100) / 100;

  // Create Razorpay order (amount in paise, 1 INR = 100 paise)
  const razorpay = getRazorpay();
  const itemId = isCourse ? courseId : resolvedSeriesId;
  const razorpayOrder = await razorpay.orders.create({
    amount: Math.round(chargeAmount * 100),
    currency: 'INR',
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
    planType: isCourse ? planType : 'batch',
    testSeries: isCourse ? null : resolvedSeriesId,
    razorpayOrderId: razorpayOrder.id,
    amount: chargeAmount,
    originalAmount,
    couponCode: appliedCoupon,
    discountAmount,
    coinsRedeemed,
    coinDiscount,
    status: 'created',
    isExtension: !!req.body.isExtension,
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
    const course = await Course.findById(courseId);
    const already = await Enrollment.findOne({ student: req.user._id, course: courseId });
    const baseAmountPaid = Math.round((payment.originalAmount - (payment.discountAmount || 0) - (payment.coinDiscount || 0)) * 100) / 100;
    if (payment.isExtension) {
      if (!already) {
        res.status(400);
        throw new Error('Enrollment not found for validity extension');
      }
      const val = course.extendValidityDurationValue || 1;
      const unit = course.extendValidityDurationUnit || 'months';
      let baseDate = new Date();
      if (already.validUntil && new Date(already.validUntil) > new Date()) {
        baseDate = new Date(already.validUntil);
      }
      if (unit === 'days') baseDate.setDate(baseDate.getDate() + val);
      else if (unit === 'months') baseDate.setMonth(baseDate.getMonth() + val);
      else if (unit === 'years') baseDate.setFullYear(baseDate.getFullYear() + val);

      already.validUntil = baseDate;
      already.pricePaid = Math.round(((already.pricePaid || 0) + baseAmountPaid) * 100) / 100;
      already.paymentId = razorpayPaymentId;
      await already.save();
      enrollment = already;
    } else if (already) {
      if (payment.planType && payment.planType !== already.planType) {
        // Calculate remaining credit from the old pricePaid
        const details = calculateUpgradeDetails(0, already, course);
        already.planType = payment.planType;
        already.pricePaid = Math.round((details.credit + baseAmountPaid) * 100) / 100;
        already.paymentId = razorpayPaymentId;
        // Reset validity to full duration of new plan
        already.validUntil = course ? calculateValidityEndDate(course.validity) : null;
        already.createdAt = new Date();
        await already.save();
      }
      enrollment = already;
    } else {
      enrollment = await Enrollment.create({
        student: req.user._id,
        course: courseId,
        planType: payment.planType || 'batch',
        pricePaid: baseAmountPaid,
        paymentId: razorpayPaymentId,
        paymentStatus: 'paid',
        validUntil: course ? calculateValidityEndDate(course.validity) : null,
      });
      await Course.findByIdAndUpdate(courseId, { $inc: { studentsEnrolled: 1 } });
    }
  } else {
    const ts = await TestSeries.findById(testSeriesId);
    const already = await TestSeriesEnrollment.findOne({ student: req.user._id, testSeries: testSeriesId });
    const baseAmountPaid = Math.round((payment.originalAmount - (payment.discountAmount || 0) - (payment.coinDiscount || 0)) * 100) / 100;
    enrollment = already || await TestSeriesEnrollment.create({
      student: req.user._id,
      testSeries: testSeriesId,
      pricePaid: baseAmountPaid,
      paymentId: razorpayPaymentId,
      paymentStatus: 'paid',
      validUntil: ts ? calculateValidityEndDate(ts.validity) : null,
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
  const { courseId, testSeriesId, couponCode, planType } = req.body;
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

  let originalAmount = 0;
  if (courseId) {
    const pType = planType || 'batch';
    if (item.plans && item.plans[pType] && item.plans[pType].price > 0) {
      originalAmount = item.plans[pType].price;
    } else {
      originalAmount = item.price || 0;
      if (pType === 'pro') originalAmount = Math.round(originalAmount * 1.25);
      else if (pType === 'infinity') originalAmount = Math.round(originalAmount * 1.5);
    }

    const existing = await Enrollment.findOne({ student: req.user._id, course: courseId });
    if (existing) {
      const details = calculateUpgradeDetails(originalAmount, existing, item);
      originalAmount = details.upgradeFee;
    }
  } else {
    originalAmount = item.price || 0;
  }

  const result = await findAndValidateCoupon(item, couponCode, originalAmount, req.user._id);
  if (!result.valid) { res.status(400); throw new Error(result.error || 'Invalid or inactive coupon code'); }

  res.json({
    valid: true,
    couponCode: couponCode.trim().toUpperCase(),
    originalAmount,
    discountAmount: result.discountAmount,
    finalAmount: Math.round((originalAmount - result.discountAmount) * 100) / 100,
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
