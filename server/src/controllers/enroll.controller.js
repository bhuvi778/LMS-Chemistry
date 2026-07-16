import asyncHandler from 'express-async-handler';
import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';
import WatchHistory from '../models/WatchHistory.js';

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

export const enrollInCourse = asyncHandler(async (req, res) => {
  const courseId = req.params.courseId;
  const course = await Course.findById(courseId);
  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }
  const existing = await Enrollment.findOne({ student: req.user._id, course: courseId });
  if (existing) {
    res.status(400);
    throw new Error('Already enrolled in this course');
  }

  let initialPrice = course.price;
  if (course.plans && course.plans.batch && course.plans.batch.price > 0) {
    initialPrice = course.plans.batch.price;
  }

  const enrollment = await Enrollment.create({
    student: req.user._id,
    course: courseId,
    planType: 'batch',
    pricePaid: initialPrice,
    paymentId: 'MOCK_' + Date.now(),
    paymentStatus: 'paid',
    validUntil: calculateValidityEndDate(course.validity),
  });
  course.studentsEnrolled = (course.studentsEnrolled || 0) + 1;
  await course.save();
  res.status(201).json(enrollment);
});

export const autoResumeEnrollmentIfNeeded = async (enrollment) => {
  if (
    enrollment &&
    enrollment.isPaused &&
    enrollment.lastPausePlannedResume &&
    new Date() >= new Date(enrollment.lastPausePlannedResume)
  ) {
    const elapsedDays = enrollment.lastPauseDuration || 30;
    const extensionMs = elapsedDays * 24 * 60 * 60 * 1000;
    
    if (enrollment.validUntil) {
      enrollment.validUntil = new Date(new Date(enrollment.validUntil).getTime() + extensionMs);
    }
    
    enrollment.pauseHistory.push({
      pausedAt: enrollment.lastPauseStart,
      resumedAt: enrollment.lastPausePlannedResume,
      durationDays: elapsedDays,
    });
    
    enrollment.isPaused = false;
    enrollment.lastPauseStart = null;
    enrollment.lastPauseDuration = null;
    enrollment.lastPausePlannedResume = null;
    
    await enrollment.save();
  }
  return enrollment;
};

export const myEnrollments = asyncHandler(async (req, res) => {
  const list = await Enrollment.find({ student: req.user._id })
    .populate('course')
    .sort({ createdAt: -1 });

  const validEnrollments = [];
  for (const e of list) {
    if (!e.course) {
      await e.deleteOne();
      continue;
    }
    await autoResumeEnrollmentIfNeeded(e);
    validEnrollments.push(e);
  }

  // Get watch history to attach duration
  const watchHistories = await WatchHistory.find({ student: req.user._id });
  const watchMap = {};
  watchHistories.forEach((w) => {
    if (w.course) {
      const courseId = w.course.toString();
      watchMap[courseId] = (watchMap[courseId] || 0) + w.watchedDuration;
    }
  });

  const listWithWatchTime = validEnrollments.map((e) => {
    const eObj = e.toObject();
    const totalSeconds = watchMap[e.course?._id?.toString()] || 0;
    eObj.watchedHours = Number((totalSeconds / 3600).toFixed(2));
    return eObj;
  });

  res.json(listWithWatchTime);
});

export const checkEnrollment = asyncHandler(async (req, res) => {
  const exists = await Enrollment.findOne({
    student: req.user._id,
    course: req.params.courseId,
  });
  if (exists) {
    await autoResumeEnrollmentIfNeeded(exists);
  }
  const isEnrolled = exists && (!exists.validUntil || new Date() <= new Date(exists.validUntil));
  res.json({ enrolled: !!isEnrolled, enrollment: exists });
});

export const pauseEnrollment = asyncHandler(async (req, res) => {
  const { enrollmentId } = req.params;
  const { durationDays } = req.body;

  const enrollment = await Enrollment.findById(enrollmentId).populate('course');
  if (!enrollment) {
    res.status(404);
    throw new Error('Enrollment not found');
  }

  if (!enrollment.course || !enrollment.course.allowFreeze) {
    res.status(400);
    throw new Error('Course freezing is not enabled for this course');
  }

  if (enrollment.student.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Access denied');
  }

  if (enrollment.paymentStatus !== 'paid') {
    res.status(400);
    throw new Error('Enrollment is not active');
  }

  if (enrollment.isPaused) {
    res.status(400);
    throw new Error('Course is already paused');
  }

  if (enrollment.pauseHistory && enrollment.pauseHistory.length >= 3) {
    res.status(400);
    throw new Error('You can only pause or freeze a course up to 3 times');
  }

  const days = Number(durationDays);
  if (isNaN(days) || ![7, 14, 21, 28].includes(days)) {
    res.status(400);
    throw new Error('Pause duration must be 7, 14, 21, or 28 days');
  }

  enrollment.isPaused = true;
  enrollment.lastPauseStart = new Date();
  enrollment.lastPauseDuration = days;
  enrollment.lastPausePlannedResume = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  await enrollment.save();
  res.json({ message: 'Course successfully paused', enrollment });
});

export const resumeEnrollment = asyncHandler(async (req, res) => {
  const { enrollmentId } = req.params;

  const enrollment = await Enrollment.findById(enrollmentId);
  if (!enrollment) {
    res.status(404);
    throw new Error('Enrollment not found');
  }

  if (enrollment.student.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Access denied');
  }

  if (!enrollment.isPaused) {
    res.status(400);
    throw new Error('Course is not paused');
  }

  const elapsedMs = Date.now() - new Date(enrollment.lastPauseStart).getTime();
  const elapsedDays = Math.ceil(elapsedMs / (1000 * 60 * 60 * 24));

  if (elapsedDays < 7) {
    res.status(400);
    throw new Error(`You must pause the course for at least 7 days before resuming. Remaining: ${7 - elapsedDays} day(s)`);
  }

  const extensionMs = elapsedDays * 24 * 60 * 60 * 1000;
  if (enrollment.validUntil) {
    enrollment.validUntil = new Date(new Date(enrollment.validUntil).getTime() + extensionMs);
  }

  enrollment.pauseHistory.push({
    pausedAt: enrollment.lastPauseStart,
    resumedAt: new Date(),
    durationDays: elapsedDays,
  });

  enrollment.isPaused = false;
  enrollment.lastPauseStart = null;
  enrollment.lastPauseDuration = null;
  enrollment.lastPausePlannedResume = null;

  await enrollment.save();
  res.json({ message: 'Course successfully resumed', enrollment });
});

export const updateWatchHistory = asyncHandler(async (req, res) => {
  const { courseId, videoUrl, videoTitle, incrementSeconds } = req.body;
  const studentId = req.user._id;

  if (!courseId || !videoUrl || !videoTitle) {
    res.status(400);
    throw new Error('Missing required fields');
  }

  const seconds = Number(incrementSeconds) || 0;

  const history = await WatchHistory.findOneAndUpdate(
    { student: studentId, course: courseId, videoUrl },
    {
      $inc: { watchedDuration: seconds },
      $set: { videoTitle, lastWatchedAt: new Date() }
    },
    { upsert: true, new: true }
  );

  res.json({ message: 'Watch history updated', history });
});

export const getWatchHistory = asyncHandler(async (req, res) => {
  const watchHistories = await WatchHistory.find({ student: req.user._id })
    .populate('course', 'title thumbnail category')
    .sort({ lastWatchedAt: -1 });

  res.json(watchHistories);
});

export const myTestSeriesEnrollments = asyncHandler(async (req, res) => {
  const TestSeriesEnrollment = (await import('../models/TestSeriesEnrollment.js')).default;
  const list = await TestSeriesEnrollment.find({ student: req.user._id, paymentStatus: 'paid' })
    .populate('testSeries')
    .sort({ createdAt: -1 });

  res.json(list);
});

