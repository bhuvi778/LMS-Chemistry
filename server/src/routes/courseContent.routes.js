import { Router } from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import {
  getLearningContent,
  adminGetLessons,
  adminAddLesson,
  adminUpdateLesson,
  adminDeleteLesson,
  adminReorderLessons,
  adminGetPdfs,
  adminCreatePdf,
  adminUpdatePdf,
  adminDeletePdf,
  adminGetTests,
  adminCreateTest,
  adminUpdateTest,
  adminDeleteTest,
  submitTest,
  adminGetAnnouncements,
  adminCreateAnnouncement,
  adminDeleteAnnouncement,
  toggleAnnouncementRead,
} from '../controllers/courseContent.controller.js';

import Course from '../models/Course.js';

const router = Router();

// Auto-resolve courseId param from slug to ObjectId if necessary
router.param('courseId', async (req, res, next, courseId) => {
  if (/^[a-f\d]{24}$/i.test(courseId)) {
    return next();
  }
  try {
    const course = await Course.findOne({ slug: courseId }).select('_id');
    if (course) {
      req.params.courseId = course._id.toString();
      return next();
    }
    return res.status(404).json({ message: 'Course not found' });
  } catch (err) {
    next(err);
  }
});

// ── Student / enrolled ────────────────────────────────────────────────────────
router.get('/learn/:courseId', protect, getLearningContent);
router.post('/learn/:courseId/announcements/:announcementId/read', protect, toggleAnnouncementRead);
router.post('/tests/:testId/submit', protect, submitTest);

// ── Admin only ────────────────────────────────────────────────────────────────
router.use(protect, adminOnly);

// Lessons (embedded in Course)
router.get('/admin/lessons/:courseId', adminGetLessons);
router.post('/admin/lessons/:courseId', adminAddLesson);
router.put('/admin/lessons/:courseId/:lessonId', adminUpdateLesson);
router.delete('/admin/lessons/:courseId/:lessonId', adminDeleteLesson);
router.put('/admin/lessons/:courseId/reorder', adminReorderLessons);

// PDFs / Notes
router.get('/admin/pdfs/:courseId', adminGetPdfs);
router.post('/admin/pdfs/:courseId', adminCreatePdf);
router.put('/admin/pdfs/:id', adminUpdatePdf);
router.delete('/admin/pdfs/:id', adminDeletePdf);

// Tests / Quizzes
router.get('/admin/tests/:courseId', adminGetTests);
router.post('/admin/tests/:courseId', adminCreateTest);
router.put('/admin/tests/:id', adminUpdateTest);
router.delete('/admin/tests/:id', adminDeleteTest);

// Announcements (embedded in Course)
router.get('/admin/announcements/:courseId', adminGetAnnouncements);
router.post('/admin/announcements/:courseId', adminCreateAnnouncement);
router.delete('/admin/announcements/:courseId/:announcementId', adminDeleteAnnouncement);

export default router;
