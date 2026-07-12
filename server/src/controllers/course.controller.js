import asyncHandler from 'express-async-handler';
import Course from '../models/Course.js';
import Category from '../models/Category.js';
import Enrollment from '../models/Enrollment.js';

export const listCourses = asyncHandler(async (req, res) => {
  const { category, q, featured, includeUnpublished, isPowerCourse } = req.query;
  const filter = {};
  // Only admins can see unpublished courses
  const isAdmin = req.user?.role === 'admin';
  if (!(isAdmin && includeUnpublished === 'true')) {
    filter.isPublished = true;
  }
  if (category && category !== 'ALL') {
    filter.$or = [{ category }, { categories: category }];
  }
  if (featured === 'true') filter.isFeatured = true;
  if (q) filter.title = { $regex: q, $options: 'i' };
  
  if (isPowerCourse === 'true') {
    filter.isPowerCourse = true;
  } else if (isPowerCourse === 'false') {
    filter.isPowerCourse = { $ne: true };
  } else {
    filter.isPowerCourse = { $ne: true };
  }

  const courses = await Course.find(filter).sort({ createdAt: -1 });
  res.json(courses);
});

export const listPublicCourses = asyncHandler(async (req, res) => {
  const { category, q, featured, isPowerCourse } = req.query;
  const filter = { isPublished: true };

  if (category && category !== 'ALL') {
    filter.$or = [{ category }, { categories: category }];
  }
  if (featured === 'true') filter.isFeatured = true;
  if (q) filter.title = { $regex: q, $options: 'i' };

  if (isPowerCourse === 'true') {
    filter.isPowerCourse = true;
  } else if (isPowerCourse === 'false') {
    filter.isPowerCourse = { $ne: true };
  } else {
    filter.isPowerCourse = { $ne: true };
  }

  const courses = await Course.find(filter)
    .select('title slug category categories subject language thumbnail shortDescription description price mrp plans validity courseType totalLessons instructor rating studentsEnrolled highlights batchInformation createdAt isPowerCourse powerCourseType powerCourseDuration')
    .sort({ createdAt: -1 });

  res.json(courses);
});

export const getCategories = asyncHandler(async (_req, res) => {
  const cats = await Category.find().sort({ name: 1 }).lean();
  // Return array of category names for backward compat
  res.json(cats.map((c) => c.name));
});

export const getCourse = asyncHandler(async (req, res) => {
  const param = req.params.id;
  // Support lookup by MongoDB ObjectId OR slug
  const isObjectId = /^[a-f\d]{24}$/i.test(param);
  const query = isObjectId
    ? Course.findById(param)
    : Course.findOne({ slug: param });
  const course = await query
    .populate('comboCourses', 'title slug thumbnail price mrp plans isFree courseType isPowerCourse powerCourseType powerCourseDuration startDate endDate')
    .populate('comboTestSeries', 'title slug thumbnail price mrp isFree')
    .populate('plans.infinity.courses', 'title slug thumbnail price mrp plans isFree courseType')
    .populate('plans.infinity.powerCourses', 'title slug thumbnail price mrp plans isFree courseType isPowerCourse powerCourseType powerCourseDuration startDate endDate')
    .populate('plans.infinity.testSeries', 'title slug thumbnail price mrp isFree');
  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }
  const enrolledInfinityCount = await Enrollment.countDocuments({
    course: course._id,
    planType: 'infinity',
  });
  res.json({ ...course.toObject(), enrolledInfinityCount });
});

export const createCourse = asyncHandler(async (req, res) => {
  console.log('createCourse payload:', req.body);
  const course = await Course.create(req.body);
  res.status(201).json(course);
});

export const updateCourse = asyncHandler(async (req, res) => {
  console.log('updateCourse payload:', req.body);
  const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }
  res.json(course);
});

export const deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findByIdAndDelete(req.params.id);
  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }
  res.json({ message: 'Course deleted' });
});

// ─── POST /api/courses/:id/review ────────────────────────────────────────────
export const addReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const ratingNum = Number(rating);
  if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
    res.status(400);
    throw new Error('Rating must be between 1 and 5');
  }
  const course = await Course.findById(req.params.id);
  if (!course) { res.status(404); throw new Error('Course not found'); }

  // Prevent duplicate reviews
  const already = (course.reviews || []).find(
    (r) => r.student?.toString() === req.user._id.toString()
  );
  if (already) {
    res.status(400);
    throw new Error('You have already reviewed this course');
  }

  course.reviews = course.reviews || [];
  course.reviews.push({
    student: req.user._id,
    studentName: req.user.name || 'Student',
    rating: ratingNum,
    comment: (comment || '').trim(),
  });

  // Recalculate average rating
  const total = course.reviews.reduce((sum, r) => sum + r.rating, 0);
  course.rating = Math.round((total / course.reviews.length) * 10) / 10;
  await course.save();

  res.status(201).json({ message: 'Review submitted', rating: course.rating });
});

export const duplicateCourse = asyncHandler(async (req, res) => {
  const original = await Course.findById(req.params.id);
  if (!original) {
    res.status(404);
    throw new Error('Course not found');
  }

  const courseData = original.toObject();
  delete courseData._id;
  delete courseData.slug;
  delete courseData.createdAt;
  delete courseData.updatedAt;

  // Reset ratings/reviews count if desired or copy them. We copy them but clear reviews for fresh start.
  courseData.reviews = [];
  courseData.rating = 4.8;
  courseData.studentsEnrolled = 0;

  courseData.title = `Copy of ${courseData.title}`;
  courseData.isPublished = false;

  const duplicated = await Course.create(courseData);
  res.status(201).json(duplicated);
});

