import asyncHandler from 'express-async-handler';
import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';

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
  const enrollment = await Enrollment.create({
    student: req.user._id,
    course: courseId,
    pricePaid: course.price,
    paymentId: 'MOCK_' + Date.now(),
    paymentStatus: 'paid',
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
  res.json({ enrolled: !!exists });
});
