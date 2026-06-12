import asyncHandler from 'express-async-handler';
import CourseSubject from '../models/CourseSubject.js';
import Enrollment from '../models/Enrollment.js';

// Free preview: first N items per content type shown to non-enrolled users
const FREE_PREVIEW_COUNT = 0;

function applyPreview(subject) {
  const cloned = JSON.parse(JSON.stringify(subject));
  cloned.chapters = (cloned.chapters || []).map((ch) => {
    const types = ['videoClasses', 'classNotes', 'tests', 'dpps', 'dppPdfs', 'dppVideos', 'studyMaterials'];
    types.forEach((t) => {
      if (!Array.isArray(ch[t])) return;
      ch[t] = ch[t].map((item, i) => {
        if (i < FREE_PREVIEW_COUNT || item.isFree) return item;
        // Locked: hide sensitive URLs, keep metadata
        return {
          _id: item._id,
          title: item.title,
          duration: item.duration || '',
          questionCount: item.questionCount || 0,
          durationMins: item.durationMins || 0,
          isFree: false,
          isLocked: true,
          order: item.order,
        };
      });
    });
    return ch;
  });
  return cloned;
}

// ─── Public: get subjects for a course (preview-only for non-enrolled) ────────
export const getSubjects = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const subjects = await CourseSubject.find({ course: courseId })
    .sort({ order: 1 })
    .lean();

  // Check enrollment if user is logged in
  let isEnrolled = false;
  if (req.user) {
    if (req.user.role === 'admin') {
      isEnrolled = true;
    } else {
      const enroll = await Enrollment.findOne({
        student: req.user._id,
        course: courseId,
      });
      isEnrolled = enroll && (!enroll.validUntil || new Date() <= new Date(enroll.validUntil));
    }
  }

  const result = isEnrolled
    ? subjects
    : subjects.map(applyPreview);

  res.json({ subjects: result, isEnrolled });
});

// ─── Admin: CRUD for subjects ─────────────────────────────────────────────────

export const adminGetSubjects = asyncHandler(async (req, res) => {
  const subjects = await CourseSubject.find({ course: req.params.courseId }).sort({ order: 1 });
  res.json(subjects);
});

export const adminCreateSubject = asyncHandler(async (req, res) => {
  const subject = await CourseSubject.create({
    ...req.body,
    course: req.params.courseId,
  });
  res.status(201).json(subject);
});

export const adminUpdateSubject = asyncHandler(async (req, res) => {
  const subject = await CourseSubject.findByIdAndUpdate(
    req.params.subjectId,
    req.body,
    { new: true, runValidators: true }
  );
  if (!subject) { res.status(404); throw new Error('Subject not found'); }
  res.json(subject);
});

export const adminDeleteSubject = asyncHandler(async (req, res) => {
  const subject = await CourseSubject.findByIdAndDelete(req.params.subjectId);
  if (!subject) { res.status(404); throw new Error('Subject not found'); }
  res.json({ message: 'Subject deleted' });
});

// ─── Admin: CRUD for chapters within a subject ────────────────────────────────

export const adminAddChapter = asyncHandler(async (req, res) => {
  const subject = await CourseSubject.findById(req.params.subjectId);
  if (!subject) { res.status(404); throw new Error('Subject not found'); }
  subject.chapters.push(req.body);
  await subject.save();
  res.status(201).json(subject.chapters[subject.chapters.length - 1]);
});

export const adminUpdateChapter = asyncHandler(async (req, res) => {
  const subject = await CourseSubject.findById(req.params.subjectId);
  if (!subject) { res.status(404); throw new Error('Subject not found'); }
  const chapter = subject.chapters.id(req.params.chapterId);
  if (!chapter) { res.status(404); throw new Error('Chapter not found'); }
  Object.assign(chapter, req.body);
  await subject.save();
  res.json(chapter);
});

export const adminDeleteChapter = asyncHandler(async (req, res) => {
  const subject = await CourseSubject.findById(req.params.subjectId);
  if (!subject) { res.status(404); throw new Error('Subject not found'); }
  subject.chapters = subject.chapters.filter(
    (ch) => ch._id.toString() !== req.params.chapterId
  );
  await subject.save();
  res.json({ message: 'Chapter deleted' });
});
