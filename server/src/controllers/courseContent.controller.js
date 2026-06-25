import asyncHandler from 'express-async-handler';
import Course from '../models/Course.js';
import CoursePdf from '../models/CoursePdf.js';
import CourseTest from '../models/CourseTest.js';
import Enrollment from '../models/Enrollment.js';
import LiveClass from '../models/LiveClass.js';
import Test from '../models/Test.js';

// ─── Student: get full learning content for an enrolled course ───────────────

export const getLearningContent = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  // Verify enrollment (admins bypass)
  let enrolled = null;
  if (req.user.role !== 'admin') {
    enrolled = await Enrollment.findOne({
      student: req.user._id,
      course: courseId,
    });
    if (!enrolled) {
      res.status(403);
      throw new Error('You are not enrolled in this course.');
    }
  } else {
    enrolled = await Enrollment.findOne({
      student: req.user._id,
      course: courseId,
    });
    if (!enrolled) {
      enrolled = { planType: 'infinity', pricePaid: 0 };
    }
  }

  const [course, pdfs, tests, liveClasses] = await Promise.all([
    Course.findById(courseId).lean(),
    CoursePdf.find({ course: courseId, isActive: true }).sort({ order: 1 }).lean(),
    CourseTest.find({ course: courseId, isActive: true })
      .sort({ order: 1 })
      .select('-questions.correct -questions.explanation') // hide answers for student
      .lean(),
    LiveClass.find({
      $or: [
        { course: courseId },
        { courses: courseId }
      ],
      isActive: true
    })
      .sort({ scheduledAt: 1 })
      .lean(),
  ]);

  if (!course) {
    res.status(404);
    throw new Error('Course not found.');
  }

  // Return enrollment object so client knows the plan details
  res.json({ course, pdfs, tests, liveClasses, enrollment: enrolled });
});

// ─── Admin: Lessons (embedded in Course) ─────────────────────────────────────

export const adminGetLessons = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.courseId).select('lessons title').lean();
  if (!course) { res.status(404); throw new Error('Course not found'); }
  res.json(course.lessons || []);
});

export const adminAddLesson = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.courseId);
  if (!course) { res.status(404); throw new Error('Course not found'); }
  course.lessons.push(req.body);
  course.totalLessons = course.lessons.length;
  await course.save();
  res.status(201).json(course.lessons[course.lessons.length - 1]);
});

export const adminUpdateLesson = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.courseId);
  if (!course) { res.status(404); throw new Error('Course not found'); }
  const lesson = course.lessons.id(req.params.lessonId);
  if (!lesson) { res.status(404); throw new Error('Lesson not found'); }
  Object.assign(lesson, req.body);
  course.totalLessons = course.lessons.length;
  await course.save();
  res.json(lesson);
});

export const adminDeleteLesson = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.courseId);
  if (!course) { res.status(404); throw new Error('Course not found'); }
  course.lessons = course.lessons.filter(
    (l) => l._id.toString() !== req.params.lessonId
  );
  course.totalLessons = course.lessons.length;
  await course.save();
  res.json({ message: 'Lesson deleted' });
});

export const adminReorderLessons = asyncHandler(async (req, res) => {
  // req.body.order: array of lesson _ids in new order
  const course = await Course.findById(req.params.courseId);
  if (!course) { res.status(404); throw new Error('Course not found'); }
  const { order } = req.body;
  const map = new Map(course.lessons.map((l) => [l._id.toString(), l]));
  course.lessons = order.map((id) => map.get(id)).filter(Boolean);
  await course.save();
  res.json(course.lessons);
});

// ─── Admin: PDFs ─────────────────────────────────────────────────────────────

export const adminGetPdfs = asyncHandler(async (req, res) => {
  const pdfs = await CoursePdf.find({ course: req.params.courseId }).sort({ order: 1 });
  res.json(pdfs);
});

export const adminCreatePdf = asyncHandler(async (req, res) => {
  const pdf = await CoursePdf.create({ ...req.body, course: req.params.courseId });
  res.status(201).json(pdf);
});

export const adminUpdatePdf = asyncHandler(async (req, res) => {
  const pdf = await CoursePdf.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!pdf) { res.status(404); throw new Error('PDF not found'); }
  res.json(pdf);
});

export const adminDeletePdf = asyncHandler(async (req, res) => {
  const pdf = await CoursePdf.findByIdAndDelete(req.params.id);
  if (!pdf) { res.status(404); throw new Error('PDF not found'); }
  res.json({ message: 'PDF deleted' });
});

// ─── Admin: Tests ─────────────────────────────────────────────────────────────

export const adminGetTests = asyncHandler(async (req, res) => {
  const courseTests = await CourseTest.find({ course: req.params.courseId }).sort({ order: 1 }).lean();
  const globalTests = await Test.find({ isActive: true }).sort({ createdAt: -1 }).lean();
  const combined = [...courseTests, ...globalTests];
  res.json(combined);
});

export const adminCreateTest = asyncHandler(async (req, res) => {
  const test = await CourseTest.create({ ...req.body, course: req.params.courseId });
  res.status(201).json(test);
});

export const adminUpdateTest = asyncHandler(async (req, res) => {
  const test = await CourseTest.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!test) { res.status(404); throw new Error('Test not found'); }
  res.json(test);
});

export const adminDeleteTest = asyncHandler(async (req, res) => {
  const test = await CourseTest.findByIdAndDelete(req.params.id);
  if (!test) { res.status(404); throw new Error('Test not found'); }
  res.json({ message: 'Test deleted' });
});

// ─── Student: Submit test & get results ───────────────────────────────────────

export const submitTest = asyncHandler(async (req, res) => {
  const { testId } = req.params;
  const { answers } = req.body; // { [questionId]: selectedIndex }

  // Verify enrollment
  const test = await CourseTest.findById(testId);
  if (!test) { res.status(404); throw new Error('Test not found'); }

  const enrolled = await Enrollment.findOne({
    student: req.user._id,
    course: test.course,
  });
  if (!enrolled && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not enrolled in this course');
  }

  let correct = 0;
  const results = test.questions.map((q) => {
    const selected = answers[q._id.toString()];
    const isCorrect = selected === q.correct;
    if (isCorrect) correct++;
    return {
      question: q.question,
      options: q.options,
      selected,
      correct: q.correct,
      explanation: q.explanation,
      isCorrect,
    };
  });

  res.json({
    total: test.questions.length,
    correct,
    score: test.questions.length > 0 ? Math.round((correct / test.questions.length) * 100) : 0,
    results,
  });
});

// ─── Admin: Announcements ─────────────────────────────────────────────────────

export const adminGetAnnouncements = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.courseId).select('announcements title').lean();
  if (!course) { res.status(404); throw new Error('Course not found'); }
  res.json(course.announcements || []);
});

export const adminCreateAnnouncement = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.courseId);
  if (!course) { res.status(404); throw new Error('Course not found'); }
  const { title, content } = req.body;
  if (!title || !content) {
    res.status(400);
    throw new Error('Title and content are required');
  }
  course.announcements = course.announcements || [];
  course.announcements.push({ title, content, createdAt: new Date() });
  await course.save();
  res.status(201).json(course.announcements[course.announcements.length - 1]);
});

export const adminDeleteAnnouncement = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.courseId);
  if (!course) { res.status(404); throw new Error('Course not found'); }
  course.announcements = (course.announcements || []).filter(
    (ann) => ann._id.toString() !== req.params.announcementId
  );
  await course.save();
  res.json({ message: 'Announcement deleted' });
});

// ─── Student: toggle announcement read status ───────────────────────────────
export const toggleAnnouncementRead = asyncHandler(async (req, res) => {
  const { courseId, announcementId } = req.params;
  const { read } = req.body;

  const enrolled = await Enrollment.findOne({
    student: req.user._id,
    course: courseId,
  });

  if (!enrolled) {
    res.status(403);
    throw new Error('You are not enrolled in this course.');
  }

  const alreadyRead = enrolled.readAnnouncements.includes(announcementId);

  if (read && !alreadyRead) {
    enrolled.readAnnouncements.push(announcementId);
  } else if (!read && alreadyRead) {
    enrolled.readAnnouncements = enrolled.readAnnouncements.filter(
      (id) => id.toString() !== announcementId
    );
  }

  await enrolled.save();
  res.json({ message: 'Success', readAnnouncements: enrolled.readAnnouncements });
});
