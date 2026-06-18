import asyncHandler from 'express-async-handler';
import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';

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

export const myEnrollments = asyncHandler(async (req, res) => {
  const list = await Enrollment.find({ student: req.user._id })
    .populate('course')
    .sort({ createdAt: -1 });
  res.json(list);
});

export const checkEnrollment = asyncHandler(async (req, res) => {
  const exists = await Enrollment.findOne({
    student: req.user._id,
    course: req.params.courseId,
  });
  const isEnrolled = exists && (!exists.validUntil || new Date() <= new Date(exists.validUntil));
  res.json({ enrolled: !!isEnrolled, enrollment: exists });
});
