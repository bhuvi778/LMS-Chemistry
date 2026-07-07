import asyncHandler from 'express-async-handler';
import BankTransferRequest from '../models/BankTransferRequest.js';
import Enrollment from '../models/Enrollment.js';
import TestSeriesEnrollment from '../models/TestSeriesEnrollment.js';
import Course from '../models/Course.js';
import TestSeries from '../models/TestSeries.js';
import User from '../models/User.js';
import CoinRedemption from '../models/CoinRedemption.js';

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

// ─── Internet handling fee calculation ───────────────────────────────────────
export const calcHandlingFee = (baseAmount) => {
  return Math.round(baseAmount * 0.03 * 100) / 100; // 3%
};

// ─── STUDENT: Submit bank transfer request ────────────────────────────────────
export const submitBankTransfer = asyncHandler(async (req, res) => {
  const {
    itemType, courseId, testSeriesId, planType,
    studentName, studentPhone, studentEmail, studentAddress,
    referenceNumber, screenshotUrl, notes,
    baseAmount, redeemCoins,
  } = req.body;

  if (!itemType || !baseAmount) {
    res.status(400); throw new Error('itemType and baseAmount are required');
  }

  let finalBaseAmount = Number(baseAmount);
  let coinsRedeemed = 0;
  let coinDiscount = 0;

  if (redeemCoins) {
    const studentUser = await User.findById(req.user._id);
    if ((studentUser.coins || 0) < 250) {
      res.status(400);
      throw new Error('Minimum 250 Ace Coins are required for redemption');
    }
    const maxCoinsNeeded = Math.floor(finalBaseAmount);
    coinsRedeemed = Math.min(studentUser.coins || 0, maxCoinsNeeded);
    coinDiscount = coinsRedeemed;
    finalBaseAmount = Math.max(0, finalBaseAmount - coinDiscount);
  }

  if (itemType === 'course' && courseId) {
    const course = await Course.findById(courseId);
    if (!course) {
      res.status(404);
      throw new Error('Course not found');
    }
    if (course.isAdmissionClosed) {
      res.status(400);
      throw new Error('This batch admission has been closed.');
    }

    const existing = await Enrollment.findOne({ student: req.user._id, course: courseId });
    if (existing) {
      const planOrder = { batch: 1, pro: 2, infinity: 3 };
      if (planOrder[planType] <= planOrder[existing.planType]) {
        res.status(400);
        throw new Error(`You are already enrolled in the ${existing.planType.toUpperCase()} plan. Downgrade or same-plan upgrade is not allowed.`);
      }

      let newPlanPrice = course.price;
      if (course.plans && course.plans[planType] && course.plans[planType].price > 0) {
        newPlanPrice = course.plans[planType].price;
      } else {
        if (planType === 'pro') newPlanPrice = Math.round(course.price * 1.25);
        else if (planType === 'infinity') newPlanPrice = Math.round(course.price * 1.5);
      }
    }
  }

  // Seat limit check for Ace Infinity in bank transfer
  if (itemType === 'course' && planType === 'infinity') {
    const item = await Course.findById(courseId);
    if (item) {
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
  }

  const handlingFee = calcHandlingFee(finalBaseAmount);
  const totalAmount = finalBaseAmount + handlingFee;

  const doc = await BankTransferRequest.create({
    student: req.user._id,
    itemType,
    course: courseId || null,
    planType: itemType === 'course' ? (planType || 'batch') : 'batch',
    testSeries: testSeriesId || null,
    baseAmount: finalBaseAmount,
    handlingFee,
    totalAmount,
    coinsRedeemed,
    coinDiscount,
    studentName: studentName || req.user.name,
    studentPhone: studentPhone || req.user.phone || '',
    studentEmail: studentEmail || req.user.email || '',
    studentAddress: studentAddress || '',
    referenceNumber: referenceNumber || '',
    screenshotUrl: screenshotUrl || '',
    notes: notes || '',
  });

  res.status(201).json(doc);
});

// ─── STUDENT: Update screenshot / ref no on existing request ─────────────────
export const updateBankTransfer = asyncHandler(async (req, res) => {
  const request = await BankTransferRequest.findOne({
    _id: req.params.id,
    student: req.user._id,
    status: 'pending',
  });
  if (!request) { res.status(404); throw new Error('Request not found or already processed'); }

  const { referenceNumber, screenshotUrl, notes, studentName, studentPhone } = req.body;
  if (referenceNumber !== undefined) request.referenceNumber = referenceNumber;
  if (screenshotUrl !== undefined) request.screenshotUrl = screenshotUrl;
  if (notes !== undefined) request.notes = notes;
  if (studentName !== undefined) request.studentName = studentName;
  if (studentPhone !== undefined) request.studentPhone = studentPhone;

  await request.save();
  res.json(request);
});

// ─── STUDENT: My bank transfer requests ──────────────────────────────────────
export const myBankTransfers = asyncHandler(async (req, res) => {
  const list = await BankTransferRequest.find({ student: req.user._id })
    .populate('course', 'title thumbnail')
    .populate('testSeries', 'title thumbnail')
    .sort({ createdAt: -1 });
  res.json(list);
});

// ─── ADMIN: List all bank transfer requests ───────────────────────────────────
export const adminListBankTransfers = asyncHandler(async (_req, res) => {
  const list = await BankTransferRequest.find()
    .populate('student', 'name email phone studentId')
    .populate('course', 'title thumbnail price')
    .populate('testSeries', 'title thumbnail price')
    .sort({ createdAt: -1 });
  res.json(list);
});

// ─── ADMIN: Confirm → auto-enroll student ────────────────────────────────────
export const adminConfirmBankTransfer = asyncHandler(async (req, res) => {
  const request = await BankTransferRequest.findById(req.params.id);
  if (!request) { res.status(404); throw new Error('Request not found'); }
  if (request.status !== 'pending') {
    res.status(400); throw new Error('Request already processed');
  }

  request.status = 'confirmed';
  request.adminNote = req.body.adminNote || '';
  request.confirmedAt = new Date();
  request.confirmedBy = req.user._id;

  // Deduct coins if request has coin redemption
  if (request.coinsRedeemed > 0) {
    const studentUser = await User.findById(request.student);
    if (studentUser) {
      studentUser.coins = Math.max(0, (studentUser.coins || 0) - request.coinsRedeemed);
      await studentUser.save();
    }

    let itemName = 'Purchased Item';
    if (request.itemType === 'course' && request.course) {
      const c = await Course.findById(request.course).select('title');
      if (c) itemName = c.title;
    } else if (request.itemType === 'test_series' && request.testSeries) {
      const ts = await TestSeries.findById(request.testSeries).select('title');
      if (ts) itemName = ts.title;
    }

    await CoinRedemption.create({
      student: request.student,
      itemType: request.itemType,
      itemId: request.course || request.testSeries,
      itemName: itemName,
      coinsSpent: request.coinsRedeemed,
      discountAmount: request.coinDiscount,
    });
  }

  await request.save();

  // Auto-enroll
  if (request.itemType === 'course' && request.course) {
    const exists = await Enrollment.findOne({ student: request.student, course: request.course });
    const courseObj = await Course.findById(request.course);
    if (exists) {
      if (request.planType && request.planType !== exists.planType) {
        // Calculate remaining credit from the old pricePaid
        let credit = 0;
        let oldPrice = exists.pricePaid || 0;
        if (oldPrice === 0 && courseObj) {
          const oldPlan = exists.planType || 'batch';
          if (courseObj.plans && courseObj.plans[oldPlan] && courseObj.plans[oldPlan].price > 0) {
            oldPrice = courseObj.plans[oldPlan].price;
          } else {
            if (oldPlan === 'batch') oldPrice = courseObj.price || 0;
            else if (oldPlan === 'pro') oldPrice = Math.round((courseObj.price || 0) * 1.25);
            else if (oldPlan === 'infinity') oldPrice = Math.round((courseObj.price || 0) * 1.5);
          }
        }

        if (exists.validUntil) {
          const startDate = exists.createdAt || new Date();
          const totalMs = new Date(exists.validUntil) - new Date(startDate);
          const remainingMs = new Date(exists.validUntil) - new Date();
          if (totalMs > 0 && remainingMs > 0) {
            credit = oldPrice * (remainingMs / totalMs);
          }
        } else {
          credit = oldPrice;
        }
        credit = Math.round(credit * 100) / 100;

        exists.planType = request.planType;
        exists.pricePaid = Math.round((credit + request.baseAmount) * 100) / 100;
        exists.paymentId = 'BANK_' + request._id;
        // Reset validity to full duration of new plan
        exists.validUntil = courseObj ? calculateValidityEndDate(courseObj.validity) : null;
        exists.createdAt = new Date();
        await exists.save();
      }
    } else {
      await Enrollment.create({
        student: request.student,
        course: request.course,
        planType: request.planType || 'batch',
        pricePaid: request.baseAmount,
        paymentId: 'BANK_' + request._id,
        paymentStatus: 'paid',
        validUntil: courseObj ? calculateValidityEndDate(courseObj.validity) : null,
      });
      await Course.findByIdAndUpdate(request.course, { $inc: { studentsEnrolled: 1 } });
    }
  } else if (request.itemType === 'test_series' && request.testSeries) {
    const exists = await TestSeriesEnrollment.findOne({ student: request.student, testSeries: request.testSeries });
    if (!exists) {
      const tsObj = await TestSeries.findById(request.testSeries);
      await TestSeriesEnrollment.create({
        student: request.student,
        testSeries: request.testSeries,
        pricePaid: request.baseAmount,
        paymentId: 'BANK_' + request._id,
        paymentStatus: 'paid',
        validUntil: tsObj ? calculateValidityEndDate(tsObj.validity) : null,
      });
    }
  }

  await request.populate([
    { path: 'student', select: 'name email phone studentId' },
    { path: 'course', select: 'title thumbnail price' },
    { path: 'testSeries', select: 'title thumbnail price' },
  ]);

  try {
    const itemName = request.itemType === 'course'
      ? request.course?.title
      : request.testSeries?.title;

    if (request.student && request.student.email && itemName) {
      const { generateInvoicePDF } = await import('../services/invoice.js');
      const { sendEnrollmentEmail, sendPaymentReceiptEmail } = await import('../services/email.js');

      const invoiceNumber = `ACE-BANK-${request._id.toString().slice(-8).toUpperCase()}`;
      const pdfBuffer = await generateInvoicePDF({
        invoiceNumber,
        invoiceDate: request.confirmedAt || new Date(),
        studentName: request.student.name,
        studentEmail: request.student.email,
        studentId: request.student.studentId || '',
        itemName,
        itemType: request.itemType,
        originalAmount: request.baseAmount,
        discountAmount: request.coinDiscount || 0,
        finalAmount: request.totalAmount,
        razorpayPaymentId: request.referenceNumber || 'BANK-TRANSFER',
        couponCode: '',
      });

      sendEnrollmentEmail(request.student.email, request.student.name, itemName, request.totalAmount).catch(() => {});
      sendPaymentReceiptEmail(request.student.email, request.student.name, {
        invoiceNumber,
        invoiceDate: request.confirmedAt || new Date(),
        itemName,
        itemType: request.itemType,
        originalAmount: request.baseAmount,
        discountAmount: request.coinDiscount || 0,
        finalAmount: request.totalAmount,
        razorpayPaymentId: request.referenceNumber || 'BANK-TRANSFER',
        couponCode: '',
      }, pdfBuffer).catch(() => {});
    }
  } catch (_) {}

  res.json(request);
});

// ─── ADMIN: Reject request ────────────────────────────────────────────────────
export const adminRejectBankTransfer = asyncHandler(async (req, res) => {
  const request = await BankTransferRequest.findById(req.params.id);
  if (!request) { res.status(404); throw new Error('Request not found'); }
  if (request.status !== 'pending') {
    res.status(400); throw new Error('Request already processed');
  }

  request.status = 'rejected';
  request.adminNote = req.body.adminNote || '';
  await request.save();
  res.json(request);
});
