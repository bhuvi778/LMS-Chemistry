import { Router } from 'express';
import { protect, adminOnly, softAuth } from '../middleware/auth.js';
import {
  getSubjects,
  adminGetSubjects,
  adminCreateSubject,
  adminUpdateSubject,
  adminDeleteSubject,
  adminAddChapter,
  adminUpdateChapter,
  adminDeleteChapter,
} from '../controllers/courseSubject.controller.js';

const router = Router();

// ── Admin only (must come BEFORE the public /:courseId wildcard) ──────────────
router.get('/admin/:courseId', protect, adminOnly, adminGetSubjects);
router.post('/admin/:courseId', protect, adminOnly, adminCreateSubject);
router.put('/admin/subject/:subjectId', protect, adminOnly, adminUpdateSubject);
router.delete('/admin/subject/:subjectId', protect, adminOnly, adminDeleteSubject);

// Chapters
router.post('/admin/subject/:subjectId/chapters', protect, adminOnly, adminAddChapter);
router.put('/admin/subject/:subjectId/chapters/:chapterId', protect, adminOnly, adminUpdateChapter);
router.delete('/admin/subject/:subjectId/chapters/:chapterId', protect, adminOnly, adminDeleteChapter);

// ── Public (with optional auth for enrollment check) — wildcard comes LAST ───
router.get('/:courseId', softAuth, getSubjects);

export default router;
