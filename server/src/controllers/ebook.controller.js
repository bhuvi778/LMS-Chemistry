import asyncHandler from 'express-async-handler';
import Ebook from '../models/Ebook.js';
import Enrollment from '../models/Enrollment.js';

// ─── Student: list accessible ebooks ─────────────────────────────────────────
export const listEbooks = asyncHandler(async (req, res) => {
  // Get student's enrolled course IDs
  let enrolledCourseIds = [];
  if (req.user) {
    const enrollments = await Enrollment.find({ student: req.user._id, paymentStatus: 'paid' }).select('course');
    enrolledCourseIds = enrollments.map((e) => String(e.course));
  }

  const ebooks = await Ebook.find({ isActive: true })
    .populate('courses', 'title thumbnail')
    .sort({ order: 1, createdAt: -1 })
    .lean();

  // Annotate each ebook with access flag
  const result = ebooks.map((eb) => {
    const hasAccess =
      eb.isFree ||
      (req.user?.role === 'admin') ||
      (enrolledCourseIds.length > 0 && (
        eb.courses.length === 0 ||
        eb.courses.some((c) => enrolledCourseIds.includes(String(c._id)))
      ));
    return { ...eb, hasAccess };
  });

  res.json(result);
});

// ─── Student: download ebook (increment counter) ─────────────────────────────
export const downloadEbook = asyncHandler(async (req, res) => {
  const ebook = await Ebook.findOne({ _id: req.params.id, isActive: true });
  if (!ebook) { res.status(404); throw new Error('Ebook not found'); }

  // Check access
  if (!ebook.isFree && req.user.role !== 'admin') {
    const enrollments = await Enrollment.find({ student: req.user._id, paymentStatus: 'paid' }).select('course');
    const enrolled = enrollments.map((e) => String(e.course));
    if (enrolled.length === 0) {
      res.status(403);
      throw new Error('Enroll in a course to access this ebook');
    }
    if (ebook.courses.length > 0) {
      const allowed = ebook.courses.some((c) => enrolled.includes(String(c)));
      if (!allowed) {
        res.status(403);
        throw new Error('Enroll in the course to access this ebook');
      }
    }
  }

  await Ebook.findByIdAndUpdate(req.params.id, { $inc: { downloads: 1 } });
  res.json({ fileUrl: ebook.fileUrl });
});

// ─── Admin: CRUD ──────────────────────────────────────────────────────────────
export const adminListEbooks = asyncHandler(async (_req, res) => {
  const list = await Ebook.find().populate('courses', 'title').sort({ order: 1, createdAt: -1 });
  res.json(list);
});

export const createEbook = asyncHandler(async (req, res) => {
  const ebook = await Ebook.create(req.body);
  res.status(201).json(ebook);
});

export const updateEbook = asyncHandler(async (req, res) => {
  const ebook = await Ebook.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!ebook) { res.status(404); throw new Error('Ebook not found'); }
  res.json(ebook);
});

export const deleteEbook = asyncHandler(async (req, res) => {
  const ebook = await Ebook.findByIdAndDelete(req.params.id);
  if (!ebook) { res.status(404); throw new Error('Ebook not found'); }
  res.json({ ok: true });
});
