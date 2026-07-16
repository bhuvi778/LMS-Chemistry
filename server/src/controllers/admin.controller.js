import asyncHandler from 'express-async-handler';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import LiveClass from '../models/LiveClass.js';
import Session from '../models/Session.js';
import Payment from '../models/Payment.js';
import Doubt from '../models/Doubt.js';
import TestSeries from '../models/TestSeries.js';
import TestSeriesEnrollment from '../models/TestSeriesEnrollment.js';
import SystemSetting from '../models/SystemSetting.js';
import PowerCourseProgress from '../models/PowerCourseProgress.js';
import { notifyMany } from './notification.controller.js';
import { signToken } from '../middleware/auth.js';
import { sendPasswordResetEmail } from '../services/email.js';

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

const openAudienceFilter = {
  $or: [
    { allowedStudents: { $exists: false } },
    { allowedStudents: { $size: 0 } },
  ],
};

const studentLiveClassAccessFilter = (studentId, courseIds = []) => ({
  $or: [
    { allowedStudents: studentId },
    {
      $and: [
        openAudienceFilter,
        {
          $or: [
            { course: null, courses: { $size: 0 } },
            { course: { $in: courseIds } },
            { courses: { $elemMatch: { $in: courseIds } } },
          ],
        },
      ],
    },
  ],
});

export const stats = asyncHandler(async (_req, res) => {
  const [students, courses, powerBatches, enrollments, revenueAgg, enrollmentTypeAgg, downloadSetting] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    Course.countDocuments({ isPowerCourse: { $ne: true } }),
    Course.countDocuments({ isPowerCourse: true }),
    Enrollment.countDocuments(),
    Enrollment.aggregate([{ $group: { _id: null, total: { $sum: '$pricePaid' } } }]),
    Enrollment.aggregate([
      { $lookup: { from: 'courses', localField: 'course', foreignField: '_id', as: 'courseDoc' } },
      { $unwind: { path: '$courseDoc', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $cond: ['$courseDoc.isPowerCourse', 'powerBatch', 'course'] },
          enrollments: { $sum: 1 },
          revenue: { $sum: '$pricePaid' },
        },
      },
    ]),
    SystemSetting.findOne({ key: 'appDownloadsCount' }),
  ]);
  const typeMap = enrollmentTypeAgg.reduce((acc, row) => {
    acc[row._id || 'course'] = row;
    return acc;
  }, {});
  res.json({
    students,
    courses,
    powerBatches,
    allCourses: courses + powerBatches,
    enrollments,
    courseEnrollments: typeMap.course?.enrollments || 0,
    powerBatchEnrollments: typeMap.powerBatch?.enrollments || 0,
    revenue: revenueAgg[0]?.total || 0,
    courseRevenue: typeMap.course?.revenue || 0,
    powerBatchRevenue: typeMap.powerBatch?.revenue || 0,
    appDownloads: downloadSetting ? Number(downloadSetting.value || 0) : 0,
  });
});

export const statsDetail = asyncHandler(async (_req, res) => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
  const courseTypeExpr = { $cond: ['$courseDoc.isPowerCourse', 'powerBatch', 'course'] };

  const [
    enrollmentsByCat,
    powerEnrollmentsByCat,
    recentEnrollments,
    recentEnrollmentsByType,
    topCourses,
    topPowerBatches,
    publishedCourses,
    publishedPowerBatches,
    monthlyRevenue,
    monthlyRevenueByType,
    studentGrowth,
    planSplit,
    powerTypeSplit,
    powerProgressAgg,
    doubtStats,
  ] = await Promise.all([
    Enrollment.aggregate([
      { $lookup: { from: 'courses', localField: 'course', foreignField: '_id', as: 'courseDoc' } },
      { $unwind: { path: '$courseDoc', preserveNullAndEmptyArrays: true } },
      { $match: { 'courseDoc.isPowerCourse': { $ne: true } } },
      { $group: { _id: '$courseDoc.category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Enrollment.aggregate([
      { $lookup: { from: 'courses', localField: 'course', foreignField: '_id', as: 'courseDoc' } },
      { $unwind: { path: '$courseDoc', preserveNullAndEmptyArrays: true } },
      { $match: { 'courseDoc.isPowerCourse': true } },
      { $group: { _id: '$courseDoc.category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Enrollment.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Enrollment.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      { $lookup: { from: 'courses', localField: 'course', foreignField: '_id', as: 'courseDoc' } },
      { $unwind: { path: '$courseDoc', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: {
            day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            type: courseTypeExpr,
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.day': 1 } },
    ]),
    Enrollment.aggregate([
      { $lookup: { from: 'courses', localField: 'course', foreignField: '_id', as: 'courseDoc' } },
      { $unwind: { path: '$courseDoc', preserveNullAndEmptyArrays: true } },
      { $match: { 'courseDoc.isPowerCourse': { $ne: true } } },
      { $group: { _id: '$course', enrollmentCount: { $sum: 1 }, revenue: { $sum: '$pricePaid' } } },
      { $sort: { enrollmentCount: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'courses', localField: '_id', foreignField: '_id', as: 'courseDoc' } },
      { $unwind: { path: '$courseDoc', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          title: '$courseDoc.title',
          category: '$courseDoc.category',
          enrollmentCount: 1,
          revenue: 1,
        },
      },
    ]),
    Enrollment.aggregate([
      { $lookup: { from: 'courses', localField: 'course', foreignField: '_id', as: 'courseDoc' } },
      { $unwind: { path: '$courseDoc', preserveNullAndEmptyArrays: true } },
      { $match: { 'courseDoc.isPowerCourse': true } },
      { $group: { _id: '$course', enrollmentCount: { $sum: 1 }, revenue: { $sum: '$pricePaid' } } },
      { $sort: { enrollmentCount: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'courses', localField: '_id', foreignField: '_id', as: 'courseDoc' } },
      { $unwind: { path: '$courseDoc', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          title: '$courseDoc.title',
          category: '$courseDoc.category',
          powerCourseType: '$courseDoc.powerCourseType',
          powerCourseDuration: '$courseDoc.powerCourseDuration',
          enrollmentCount: 1,
          revenue: 1,
        },
      },
    ]),
    Course.countDocuments({ isPublished: true, isPowerCourse: { $ne: true } }),
    Course.countDocuments({ isPublished: true, isPowerCourse: true }),
    // Monthly revenue for last 6 months
    Payment.aggregate([
      { $match: { status: 'paid', createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Enrollment.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $lookup: { from: 'courses', localField: 'course', foreignField: '_id', as: 'courseDoc' } },
      { $unwind: { path: '$courseDoc', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: {
            month: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            type: courseTypeExpr,
          },
          revenue: { $sum: '$pricePaid' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.month': 1 } },
    ]),
    // Student growth for last 6 months
    User.aggregate([
      { $match: { role: 'student', createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Enrollment.aggregate([
      { $lookup: { from: 'courses', localField: 'course', foreignField: '_id', as: 'courseDoc' } },
      { $unwind: { path: '$courseDoc', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { type: courseTypeExpr, planType: '$planType' },
          count: { $sum: 1 },
          revenue: { $sum: '$pricePaid' },
        },
      },
      { $sort: { '_id.planType': 1 } },
    ]),
    Enrollment.aggregate([
      { $lookup: { from: 'courses', localField: 'course', foreignField: '_id', as: 'courseDoc' } },
      { $unwind: { path: '$courseDoc', preserveNullAndEmptyArrays: true } },
      { $match: { 'courseDoc.isPowerCourse': true } },
      {
        $group: {
          _id: '$courseDoc.powerCourseType',
          count: { $sum: 1 },
          revenue: { $sum: '$pricePaid' },
        },
      },
      { $sort: { count: -1 } },
    ]),
    Promise.all([
      PowerCourseProgress.countDocuments(),
      PowerCourseProgress.aggregate([
        {
          $group: {
            _id: null,
            completedDays: { $sum: { $size: { $ifNull: ['$completedDays', []] } } },
            activeStudents: { $addToSet: '$student' },
          },
        },
      ]),
      Enrollment.aggregate([
        { $lookup: { from: 'courses', localField: 'course', foreignField: '_id', as: 'courseDoc' } },
        { $unwind: { path: '$courseDoc', preserveNullAndEmptyArrays: true } },
        { $match: { 'courseDoc.isPowerCourse': true } },
        { $group: { _id: null, avgProgress: { $avg: '$progress' }, completed: { $sum: { $cond: [{ $gte: ['$progress', 100] }, 1, 0] } } } },
      ]),
    ]).then(([progressRecords, completedAgg, avgAgg]) => ({
      progressRecords,
      completedDays: completedAgg[0]?.completedDays || 0,
      activeStudents: completedAgg[0]?.activeStudents?.length || 0,
      avgProgress: Math.round(avgAgg[0]?.avgProgress || 0),
      completedEnrollments: avgAgg[0]?.completed || 0,
    })),
    // Doubt stats
    Promise.all([
      Doubt.countDocuments({ status: 'open' }),
      Doubt.countDocuments({ status: 'answered' }),
    ]).then(([open, answered]) => ({ open, answered })),
  ]);

  // Fill missing days in last 7
  const dayMap = {};
  recentEnrollments.forEach((d) => { dayMap[d._id] = d.count; });
  const dayTypeMap = {};
  recentEnrollmentsByType.forEach((d) => {
    dayTypeMap[d._id.day] = dayTypeMap[d._id.day] || { course: 0, powerBatch: 0 };
    dayTypeMap[d._id.day][d._id.type] = d.count;
  });
  const recentDays = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    const split = dayTypeMap[key] || { course: 0, powerBatch: 0 };
    recentDays.push({
      day: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      count: dayMap[key] || 0,
      course: split.course || 0,
      powerBatch: split.powerBatch || 0,
    });
  }

  // Format monthly revenue with month labels
  const monthlyRevenueFormatted = monthlyRevenue.map((m) => ({
    month: new Date(m._id + '-01').toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
    revenue: m.revenue,
    count: m.count,
  }));
  const monthlyTypeMap = {};
  monthlyRevenueByType.forEach((m) => {
    monthlyTypeMap[m._id.month] = monthlyTypeMap[m._id.month] || { course: { revenue: 0, count: 0 }, powerBatch: { revenue: 0, count: 0 } };
    monthlyTypeMap[m._id.month][m._id.type] = { revenue: m.revenue, count: m.count };
  });
  const monthlyProductRevenue = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = d.toISOString().slice(0, 7);
    const split = monthlyTypeMap[key] || { course: { revenue: 0, count: 0 }, powerBatch: { revenue: 0, count: 0 } };
    monthlyProductRevenue.push({
      month: d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
      courseRevenue: split.course?.revenue || 0,
      courseCount: split.course?.count || 0,
      powerBatchRevenue: split.powerBatch?.revenue || 0,
      powerBatchCount: split.powerBatch?.count || 0,
    });
  }
  const studentGrowthFormatted = studentGrowth.map((m) => ({
    month: new Date(m._id + '-01').toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
    count: m.count,
  }));

  const summarizePlanSplit = (type) => planSplit
    .filter((row) => row._id.type === type)
    .map((row) => ({
      planType: row._id.planType || 'batch',
      count: row.count,
      revenue: row.revenue,
    }));
  const sum = (rows, key) => rows.reduce((total, row) => total + (row[key] || 0), 0);

  res.json({
    enrollmentsByCat,
    powerEnrollmentsByCat,
    recentDays,
    topCourses,
    topPowerBatches,
    publishedCourses,
    publishedPowerBatches,
    monthlyRevenue: monthlyRevenueFormatted,
    monthlyProductRevenue,
    studentGrowth: studentGrowthFormatted,
    courseAnalytics: {
      published: publishedCourses,
      categorySplit: enrollmentsByCat,
      planSplit: summarizePlanSplit('course'),
      topItems: topCourses,
      enrollments: sum(summarizePlanSplit('course'), 'count'),
      revenue: sum(summarizePlanSplit('course'), 'revenue'),
    },
    powerBatchAnalytics: {
      published: publishedPowerBatches,
      categorySplit: powerEnrollmentsByCat,
      planSplit: summarizePlanSplit('powerBatch'),
      typeSplit: powerTypeSplit.map((row) => ({
        type: row._id || 'other',
        count: row.count,
        revenue: row.revenue,
      })),
      topItems: topPowerBatches,
      enrollments: sum(summarizePlanSplit('powerBatch'), 'count'),
      revenue: sum(summarizePlanSplit('powerBatch'), 'revenue'),
      progress: powerProgressAgg,
    },
    doubtStats,
  });
});

export const allStudents = asyncHandler(async (_req, res) => {
  const TestSeriesEnrollment = (await import('../models/TestSeriesEnrollment.js')).default;
  // Include plainPassword for admin viewing — never expose this to students
  const students = await User.find({ role: 'student' }).select('-password').lean();
  const [enrollments, testSeriesEnrollments] = await Promise.all([
    Enrollment.find().populate('course', 'title category price plans isPowerCourse').lean(),
    TestSeriesEnrollment.find().populate('testSeries', 'title categories price').lean()
  ]);

  const byStudent = enrollments.filter((e) => e.course).reduce((acc, e) => {
    const k = String(e.student);
    (acc[k] = acc[k] || []).push(e);
    return acc;
  }, {});

  const tsByStudent = testSeriesEnrollments.reduce((acc, e) => {
    const k = String(e.student);
    (acc[k] = acc[k] || []).push(e);
    return acc;
  }, {});

  const data = students.map((s) => ({
    ...s,
    enrollments: byStudent[String(s._id)] || [],
    testSeriesEnrollments: tsByStudent[String(s._id)] || [],
  }));
  res.json(data);
});

export const allEnrollments = asyncHandler(async (_req, res) => {
  const TestSeriesEnrollment = (await import('../models/TestSeriesEnrollment.js')).default;
  const [courseEnrolls, testSeriesEnrolls] = await Promise.all([
    Enrollment.find()
      .populate('student', 'name email studentId phone avatar createdAt')
      .populate('course', 'title category price thumbnail isPowerCourse')
      .sort({ createdAt: -1 }),
    TestSeriesEnrollment.find()
      .populate('student', 'name email studentId phone avatar createdAt')
      .populate('testSeries', 'title categories price')
      .sort({ createdAt: -1 })
  ]);

  const courseList = courseEnrolls
    .filter((e) => e.course)
    .map(e => ({
      ...e.toObject(),
      type: 'course'
    }));

  const seriesList = testSeriesEnrolls.map(e => ({
    ...e.toObject(),
    type: 'test_series',
    course: e.testSeries ? {
      _id: e.testSeries._id,
      title: e.testSeries.title,
      category: e.testSeries.categories?.[0] || 'Test Series',
      price: e.testSeries.price,
      thumbnail: null
    } : null
  }));

  const combined = [...courseList, ...seriesList].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(combined);
});

// ── Live Classes ────────────────────────────────────────────────
export const getLiveClasses = asyncHandler(async (_req, res) => {
  const list = await LiveClass.find()
    .populate('course', 'title category isPowerCourse powerCourseType powerCourseDuration')
    .populate('courses', 'title category isPowerCourse powerCourseType powerCourseDuration')
    .sort({ scheduledAt: 1 });
  res.json(list);
});

export const createLiveClass = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  // Sanitize: empty string course is not a valid ObjectId
  if (!body.course || body.course === '') body.course = null;
  if (!body.courses || !Array.isArray(body.courses)) body.courses = [];
  // Filter out empty string course IDs
  body.courses = body.courses.filter(c => c && c !== '');
  if (!Array.isArray(body.allowedStudents)) body.allowedStudents = [];
  body.allowedStudents = body.allowedStudents.filter(s => s && s !== '');

  const lc = await LiveClass.create(body);
  const link = lc.useInternalRoom ? `/live/${lc._id}` : (lc.meetLink || '');
  const notifPayload = {
    title: `New Live Class: ${lc.title}`,
    message: `Scheduled at ${new Date(lc.scheduledAt).toLocaleString('en-IN')} · ${lc.durationMins} min · ${lc.instructor}`,
    type: 'live_class',
    link,
    refId: lc._id,
  };

  // Collect course IDs from the saved live class
  const courseIds = [];
  if (lc.course) courseIds.push(lc.course);
  if (lc.courses && lc.courses.length > 0) {
    lc.courses.forEach((c) => {
      const cid = c.toString();
      if (!courseIds.map(x => x.toString()).includes(cid)) {
        courseIds.push(c);
      }
    });
  }

  if (lc.allowedStudents?.length > 0) {
    const userIds = [...new Set(lc.allowedStudents.map((studentId) => studentId.toString()))];
    await notifyMany(userIds, notifPayload);
  } else if (courseIds.length > 0) {
    // Linked class: notify enrolled students of those specific courses
    const enrollments = await Enrollment.find({ course: { $in: courseIds } }).select('student');
    const userIds = [...new Set(enrollments.map((e) => e.student.toString()))];
    if (userIds.length) {
      await notifyMany(userIds, notifPayload);
    }
  } else {
    // No linked course: this is an open/broadcast class — notify ALL active students
    const allStudents = await User.find({ role: 'student' }).select('_id');
    const userIds = allStudents.map(u => u._id.toString());
    if (userIds.length) {
      await notifyMany(userIds, notifPayload);
    }
  }
  res.status(201).json(lc);
});

export const updateLiveClass = asyncHandler(async (req, res) => {
  const lc = await LiveClass.findById(req.params.id);
  if (!lc) return res.status(404).json({ message: 'Not found' });
  const updates = { ...req.body };
  // Sanitize: empty string course is not a valid ObjectId
  if (updates.course === '' || updates.course === undefined) updates.course = null;
  if (Array.isArray(updates.courses)) {
    updates.courses = updates.courses.filter(c => c && c !== '');
  }
  if (updates.allowedStudents !== undefined) {
    updates.allowedStudents = Array.isArray(updates.allowedStudents)
      ? updates.allowedStudents.filter(s => s && s !== '')
      : [];
  }
  Object.assign(lc, updates);
  if (req.body.courses !== undefined) {
    lc.courses = updates.courses;
  }
  await lc.save();
  res.json(lc);
});

export const deleteLiveClass = asyncHandler(async (req, res) => {
  await LiveClass.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

// For students: upcoming active live classes scoped to their enrollments
export const upcomingLiveClasses = asyncHandler(async (req, res) => {
  const baseQuery = {
    isActive: true,
    scheduledAt: { $gte: new Date(Date.now() - 2 * 60 * 60 * 1000) },
  };

  let query = baseQuery;

  if (req.user && req.user.role !== 'admin') {
    const myEnrolls = await Enrollment.find({ student: req.user._id }).select('course');
    const myCourseIds = myEnrolls.map((e) => e.course);
    query = {
      ...baseQuery,
      ...studentLiveClassAccessFilter(req.user._id, myCourseIds),
    };
  }

  const list = await LiveClass.find(query)
    .populate('course', 'title category')
    .populate('courses', 'title category')
    .sort({ scheduledAt: 1 })
    .limit(20);
  res.json(list);
});

// For students: all live classes (ongoing + upcoming + past) scoped to their enrollments
export const allLiveClassesForStudent = asyncHandler(async (req, res) => {
  let courseFilter = {};
  if (req.user && req.user.role !== 'admin') {
    const myEnrolls = await Enrollment.find({ student: req.user._id }).select('course');
    const myCourseIds = myEnrolls.map((e) => e.course);
    courseFilter = studentLiveClassAccessFilter(req.user._id, myCourseIds);
  }

  const now = new Date();
  const allClasses = await LiveClass.find({ isActive: true, ...courseFilter })
    .populate('course', 'title category')
    .populate('courses', 'title category')
    .sort({ scheduledAt: -1 })
    .limit(100);

  const ongoing = [];
  const upcoming = [];
  const past = [];

  allClasses.forEach((lc) => {
    const startTime = new Date(lc.scheduledAt);
    const endTime = new Date(startTime.getTime() + (lc.durationMins || 60) * 60 * 1000);

    if (lc.status === 'live' || (lc.status !== 'ended' && startTime <= now && endTime >= now)) {
      ongoing.push(lc);
    } else if (lc.status === 'ended' || endTime < now) {
      past.push(lc);
    } else {
      upcoming.push(lc);
    }
  });

  // Sort: ongoing by start ASC, upcoming by start ASC, past by start DESC
  ongoing.sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
  upcoming.sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
  past.sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt));

  res.json({ ongoing, upcoming, past });
});

// ── Single student detail (with full info) ─────────────────────
export const getStudent = asyncHandler(async (req, res) => {
  // Include plainPassword for admin — never expose to students
  const user = await User.findById(req.params.id).select('-password').lean();
  if (!user || user.role !== 'student') {
    res.status(404);
    throw new Error('Student not found');
  }
  const rawEnrollments = await Enrollment.find({ student: user._id })
    .populate('course', 'title category price thumbnail courseType plans isPowerCourse powerCourseDuration')
    .lean();
  const orphanEnrollmentIds = rawEnrollments.filter((e) => !e.course).map((e) => e._id);
  if (orphanEnrollmentIds.length) {
    await Enrollment.deleteMany({ _id: { $in: orphanEnrollmentIds }, student: user._id });
  }
  const enrollments = rawEnrollments.filter((e) => e.course);
  const testSeriesEnrollments = await TestSeriesEnrollment.find({ student: user._id })
    .populate('testSeries', 'title price thumbnail')
    .lean();
  const sessions = await Session.find({ userId: user._id, isActive: true })
    .select('-tokenHash')
    .lean();
  res.json({ ...user, enrollments, testSeriesEnrollments, sessions });
});

// ── Reset student password (admin only) ────────────────────────
export const resetStudentPassword = asyncHandler(async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    res.status(400);
    throw new Error('Password must be 6+ characters');
  }
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error('User not found'); }
  user.password = await bcrypt.hash(newPassword, 10);
  user.plainPassword = newPassword;
  user.passwordSetAt = new Date();
  user.passwordSetByAdmin = true;
  await user.save();
  // Revoke all sessions of this user — force re-login
  await Session.updateMany({ userId: user._id, isActive: true }, { $set: { isActive: false, logoutTime: new Date() } });
  // Email the new password to the student
  sendPasswordResetEmail(user.email, user.name, newPassword).catch(() => {});
  res.json({ ok: true, message: 'Password reset and all sessions revoked' });
});

// ── Revoke single student sessions ─────────────────────────────
export const revokeStudentSessions = asyncHandler(async (req, res) => {
  await Session.updateMany({ userId: req.params.id, isActive: true }, { $set: { isActive: false, logoutTime: new Date() } });
  res.json({ ok: true });
});

// ── Admin impersonate student (generate a token for the student) ─
export const impersonateStudent = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user || user.role !== 'student') {
    res.status(404);
    throw new Error('Student not found');
  }
  const token = signToken(user);
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  await Session.create({
    userId: user._id,
    tokenHash,
    deviceInfo: `Admin Impersonation by ${req.user?.name || 'Admin'}`,
    ip: (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || '',
    lastActive: new Date(),
  });
  res.json({
    token,
    student: {
      _id: user._id,
      studentId: user.studentId,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      avatar: user.avatar || '',
      role: user.role,
      twoFactorEnabled: user.twoFactorEnabled || false,
      twoFactorMethod: user.twoFactorMethod || 'none',
      createdAt: user.createdAt,
    },
  });
});

// ── Admin enroll student in a course ───────────────────────────
export const adminEnrollStudent = asyncHandler(async (req, res) => {
  const { courseId, planType } = req.body;
  if (!courseId) { res.status(400); throw new Error('courseId is required'); }

  const student = await User.findById(req.params.id);
  if (!student || student.role !== 'student') {
    res.status(404); throw new Error('Student not found');
  }

  const course = await Course.findById(courseId);
  if (!course) { res.status(404); throw new Error('Course not found'); }

  const pType = planType || 'batch';
  let initialPrice = course.price;
  if (course.plans && course.plans[pType] && course.plans[pType].price > 0) {
    initialPrice = course.plans[pType].price;
  } else {
    if (pType === 'pro') initialPrice = Math.round(course.price * 1.25);
    else if (pType === 'infinity') initialPrice = Math.round(course.price * 1.5);
  }

  const existing = await Enrollment.findOne({ student: student._id, course: courseId });
  if (existing) {
    existing.planType = pType;
    existing.pricePaid = 0;
    existing.paymentStatus = 'paid';
    existing.validUntil = calculateValidityEndDate(course.validity);
    existing.createdAt = new Date();
    await existing.save();
    await existing.populate('course', 'title category price thumbnail courseType isPowerCourse powerCourseDuration');
    return res.status(200).json(existing);
  }

  const enrollment = await Enrollment.create({
    student: student._id,
    course: courseId,
    planType: pType,
    pricePaid: 0,
    paymentId: 'ADMIN_ALLOT_' + Date.now(),
    paymentStatus: 'paid',
    validUntil: calculateValidityEndDate(course.validity),
  });

  course.studentsEnrolled = (course.studentsEnrolled || 0) + 1;
  await course.save();

  await enrollment.populate('course', 'title category price thumbnail courseType isPowerCourse powerCourseDuration');
  res.status(201).json(enrollment);
});

// ── Admin remove enrollment ─────────────────────────────────────
export const adminRemoveEnrollment = asyncHandler(async (req, res) => {
  const enrollment = await Enrollment.findOne({
    student: req.params.id,
    course: req.params.courseId,
  });
  if (!enrollment) { res.status(404); throw new Error('Enrollment not found'); }

  await enrollment.deleteOne();

  await Course.findByIdAndUpdate(req.params.courseId, {
    $inc: { studentsEnrolled: -1 },
  });

  res.json({ ok: true });
});

export const adminRemoveEnrollmentById = asyncHandler(async (req, res) => {
  const enrollment = await Enrollment.findOne({
    _id: req.params.enrollmentId,
    student: req.params.id,
  });
  if (!enrollment) { res.status(404); throw new Error('Enrollment not found'); }

  const courseId = enrollment.course;
  await enrollment.deleteOne();

  if (courseId) {
    await Course.findByIdAndUpdate(courseId, {
      $inc: { studentsEnrolled: -1 },
    });
  }

  res.json({ ok: true });
});

// ── Admin enroll student in a test series ──────────────────────
export const adminEnrollTestSeries = asyncHandler(async (req, res) => {
  const { seriesId } = req.body;
  if (!seriesId) { res.status(400); throw new Error('seriesId is required'); }

  const student = await User.findById(req.params.id);
  if (!student || student.role !== 'student') {
    res.status(404); throw new Error('Student not found');
  }

  const series = await TestSeries.findById(seriesId);
  if (!series) { res.status(404); throw new Error('Test Series not found'); }

  const existing = await TestSeriesEnrollment.findOne({ student: student._id, testSeries: seriesId });
  if (existing) { res.status(400); throw new Error('Student is already enrolled in this test series'); }

  const enrollment = await TestSeriesEnrollment.create({
    student: student._id,
    testSeries: seriesId,
    pricePaid: 0,
    paymentId: 'ADMIN_ALLOT_' + Date.now(),
    paymentStatus: 'paid',
    validUntil: calculateValidityEndDate(series.validity),
  });

  await enrollment.populate('testSeries', 'title price thumbnail');
  res.status(201).json(enrollment);
});

// ── Admin remove test series enrollment ────────────────────────
export const adminRemoveTestSeriesEnrollment = asyncHandler(async (req, res) => {
  const enrollment = await TestSeriesEnrollment.findOne({
    student: req.params.id,
    testSeries: req.params.seriesId,
  });
  if (!enrollment) { res.status(404); throw new Error('Enrollment not found'); }

  await enrollment.deleteOne();
  res.json({ ok: true });
});

// ── Admin create student manually ──────────────────────────────
export const createStudent = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !name.trim()) { res.status(400); throw new Error('Name is required'); }
  if (!email || !email.trim()) { res.status(400); throw new Error('Email is required'); }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) { res.status(400); throw new Error('A user with this email already exists'); }

  const genStudentId = () =>
    'CHEM' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 90 + 10);

  const rawPassword = (password && password.trim()) ||
    (() => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
      let pw = '';
      for (let i = 0; i < 10; i++) pw += chars[Math.floor(Math.random() * chars.length)];
      return pw;
    })();

  const hashed = await bcrypt.hash(rawPassword, 10);

  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    phone: phone ? phone.trim() : undefined,
    password: hashed,
    plainPassword: rawPassword,
    studentId: genStudentId(),
    role: 'student',
    passwordSetByAdmin: true,
    passwordSetAt: new Date(),
  });

  res.status(201).json({
    _id: user._id,
    studentId: user.studentId,
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    plainPassword: rawPassword,
    createdAt: user.createdAt,
  });
});

export const updateStudent = asyncHandler(async (req, res) => {
  const { name, phone, streak, longestStreak, coins, isActive, maxSessions, isWhatsappVerified } = req.body;
  const user = await User.findById(req.params.id);
  if (!user || user.role !== 'student') {
    res.status(404);
    throw new Error('Student not found');
  }

  if (name !== undefined) user.name = name.trim();
  if (phone !== undefined) {
    const phoneVal = phone.trim();
    if (phoneVal && phoneVal !== user.phone) {
      const exists = await User.findOne({ phone: phoneVal, _id: { $ne: user._id } });
      if (exists) {
        res.status(400);
        throw new Error('WhatsApp number already registered by another user');
      }
      user.phone = phoneVal;
    } else if (!phoneVal) {
      user.phone = '';
    }
  }
  if (streak !== undefined) user.streak = streak;
  if (longestStreak !== undefined) user.longestStreak = longestStreak;
  if (coins !== undefined) user.coins = coins;
  if (isActive !== undefined) user.isActive = isActive;
  if (maxSessions !== undefined) user.maxSessions = maxSessions;
  if (isWhatsappVerified !== undefined) user.isWhatsappVerified = isWhatsappVerified;

  await user.save();

  // If deactivated, force logout by revoking all active sessions
  if (isActive === false) {
    await Session.updateMany({ userId: user._id, isActive: true }, { $set: { isActive: false, logoutTime: new Date() } });
  }

  res.json({
    _id: user._id,
    studentId: user.studentId,
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    isWhatsappVerified: user.isWhatsappVerified,
    streak: user.streak,
    longestStreak: user.longestStreak,
    coins: user.coins,
    isActive: user.isActive,
    maxSessions: user.maxSessions,
    createdAt: user.createdAt,
  });
});

export const deleteStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) {
    res.status(404);
    throw new Error('Student not found');
  }

  // Delete user
  await User.findByIdAndDelete(id);

  // Lazy imports of models to avoid circular dependency issues
  const { default: Enrollment } = await import('../models/Enrollment.js');
  const { default: TestSeriesEnrollment } = await import('../models/TestSeriesEnrollment.js');
  const { default: TestAttempt } = await import('../models/TestAttempt.js');
  const { default: SavedQuestion } = await import('../models/SavedQuestion.js');
  const { default: OTP } = await import('../models/OTP.js');

  // Cascade delete all dependencies
  await Promise.all([
    Enrollment.deleteMany({ student: id }),
    TestSeriesEnrollment.deleteMany({ student: id }),
    Session.deleteMany({ userId: id }),
    OTP.deleteMany({ userId: id }),
    TestAttempt.deleteMany({ user: id }),
    SavedQuestion.deleteMany({ user: id }),
  ]);

  res.json({ ok: true, message: 'Student and all associated data permanently deleted' });
});

export const revokeStudentSessionSingle = asyncHandler(async (req, res) => {
  const { id, sessionId } = req.params;
  await Session.updateOne({ _id: sessionId, userId: id }, { $set: { isActive: false, logoutTime: new Date() } });
  res.json({ ok: true });
});

// ── Course-scoped live classes for student (Course detail page) ─
export const liveClassesForCourse = asyncHandler(async (req, res) => {
  const audienceFilter = req.user?.role === 'admin'
    ? {}
    : {
        $or: [
          { allowedStudents: req.user._id },
          openAudienceFilter,
        ],
      };
  const list = await LiveClass.find({
    $and: [
      {
        $or: [
          { course: req.params.courseId },
          { courses: req.params.courseId },
        ],
      },
      audienceFilter,
    ],
    isActive: true,
  })
    .populate('course', 'title category isPowerCourse powerCourseType powerCourseDuration')
    .populate('courses', 'title category isPowerCourse powerCourseType powerCourseDuration')
    .sort({ scheduledAt: -1 })
    .limit(50);
  res.json(list);
});

// ── Course Ratings / Reviews moderation (Admin only) ─────────────
export const getCourseRatings = asyncHandler(async (req, res) => {
  const courses = await Course.find({}, 'title reviews').populate('reviews.student', 'name email');
  const allReviews = [];
  courses.forEach((c) => {
    if (c.reviews && c.reviews.length) {
      c.reviews.forEach((r) => {
        allReviews.push({
          _id: r._id,
          courseId: c._id,
          courseTitle: c.title,
          studentName: r.studentName,
          studentEmail: r.student?.email || '',
          rating: r.rating,
          comment: r.comment,
          createdAt: r.createdAt,
        });
      });
    }
  });
  allReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(allReviews);
});

export const deleteCourseRating = asyncHandler(async (req, res) => {
  const { courseId, reviewId } = req.params;
  const course = await Course.findById(courseId);
  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }

  course.reviews = (course.reviews || []).filter((r) => r._id.toString() !== reviewId);

  if (course.reviews.length > 0) {
    const total = course.reviews.reduce((sum, r) => sum + r.rating, 0);
    course.rating = Math.round((total / course.reviews.length) * 10) / 10;
  } else {
    course.rating = 4.8;
  }

  await course.save();
  res.json({ message: 'Review deleted successfully', rating: course.rating });
});



// ── Gamification Stats Endpoints ─────────────────────────────────────────────

export const getStreakStats = asyncHandler(async (_req, res) => {
  const students = await User.find({ role: 'student' })
    .select('name email studentId streak longestStreak activeDays streakFrozen lastLoginDate coins')
    .sort({ streak: -1 })
    .lean();
  res.json(students);
});

export const getWalletStats = asyncHandler(async (_req, res) => {
  const students = await User.find({ role: 'student' })
    .select('name email studentId coins activeDays createdAt')
    .sort({ coins: -1 })
    .lean();
  const totalCoins = students.reduce((sum, s) => sum + (s.coins || 0), 0);
  res.json({ totalCoins, totalStudents: students.length, students });
});

export const getReferralStats = asyncHandler(async (_req, res) => {
  const referrers = await User.find({ role: 'student', referralCount: { $gt: 0 } })
    .select('name email studentId referralCount coins')
    .sort({ referralCount: -1 })
    .lean();
  const referred = await User.find({ role: 'student', referredBy: { $ne: '' } })
    .select('name email studentId referredBy createdAt')
    .sort({ createdAt: -1 })
    .lean();
  res.json({ referrers, referred, totalReferrals: referred.length });
});

export const adminAddCoins = asyncHandler(async (req, res) => {
  const { amount, reason } = req.body;
  if (amount === undefined) { res.status(400); throw new Error('amount is required'); }
  const user = await User.findById(req.params.id);
  if (!user || user.role !== 'student') { res.status(404); throw new Error('Student not found'); }
  user.coins = Math.max(0, (user.coins || 0) + parseInt(amount));
  await user.save();
  res.json({ ok: true, coins: user.coins, reason });
});

export const adminResetStreak = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user || user.role !== 'student') { res.status(404); throw new Error('Student not found'); }
  const { newStreak = 0 } = req.body;
  user.streak = newStreak;
  if (newStreak > (user.longestStreak || 0)) user.longestStreak = newStreak;
  await user.save();
  res.json({ ok: true, streak: user.streak });
});

export const adminFreezeStreak = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user || user.role !== 'student') { res.status(404); throw new Error('Student not found'); }
  const { frozen } = req.body;
  user.streakFrozen = !!frozen;
  await user.save();
  res.json({ ok: true, streakFrozen: user.streakFrozen });
});

export const adminExtendEnrollmentValidity = asyncHandler(async (req, res) => {
  const { validUntil, planType } = req.body;
  let enrollment = await Enrollment.findById(req.params.id);
  let isCourse = true;
  if (!enrollment) {
    const TestSeriesEnrollment = (await import('../models/TestSeriesEnrollment.js')).default;
    enrollment = await TestSeriesEnrollment.findById(req.params.id);
    isCourse = false;
  }
  if (!enrollment) {
    res.status(404);
    throw new Error('Enrollment not found');
  }
  enrollment.validUntil = validUntil ? new Date(validUntil) : null;
  if (isCourse && planType) {
    enrollment.planType = planType;
  }
  await enrollment.save();
  res.json({ ok: true, enrollment });
});

export const getGlobalSettings = asyncHandler(async (_req, res) => {
  const settings = await SystemSetting.find();
  const map = {};
  settings.forEach((s) => {
    map[s.key] = s.value;
  });
  if (map.maxSessions === undefined) map.maxSessions = 5;
  if (map.studentSessionTimeout === undefined) map.studentSessionTimeout = 10;
  if (map.appDownloadsCount === undefined) map.appDownloadsCount = 0;
  res.json(map);
});

export const updateGlobalSettings = asyncHandler(async (req, res) => {
  const { key, value } = req.body;
  if (!key) {
    res.status(400);
    throw new Error('Key is required');
  }
  let setting = await SystemSetting.findOne({ key });
  if (!setting) {
    setting = new SystemSetting({ key });
  }
  setting.value = value;
  await setting.save();
  res.json(setting);
});

export const incrementAppDownloads = asyncHandler(async (_req, res) => {
  let setting = await SystemSetting.findOne({ key: 'appDownloadsCount' });
  if (!setting) {
    setting = new SystemSetting({ key: 'appDownloadsCount', value: 0 });
  }
  setting.value = Number(setting.value || 0) + 1;
  await setting.save();
  res.json({ ok: true, appDownloadsCount: setting.value });
});

export const getLoginAnalytics = asyncHandler(async (_req, res) => {
  const downloadSetting = await SystemSetting.findOne({ key: 'appDownloadsCount' });
  const appDownloads = downloadSetting ? Number(downloadSetting.value || 0) : 0;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const sessions = await Session.find({ createdAt: { $gte: sevenDaysAgo } })
    .populate('userId', 'name email studentId')
    .sort({ createdAt: -1 })
    .lean();

  const loginLogs = sessions.map((s) => ({
    _id: s._id,
    studentName: s.userId?.name || 'Unknown Student',
    studentEmail: s.userId?.email || 'N/A',
    studentId: s.userId?.studentId || 'N/A',
    deviceInfo: s.deviceInfo,
    ip: s.ip,
    loginTime: s.createdAt,
    logoutTime: s.logoutTime || null,
    isActive: s.isActive !== false,
  }));

  res.json({ appDownloads, loginLogs });
});
