import { Router } from 'express';
import { protect, adminOnly, softAuth } from '../middleware/auth.js';
import {
  adminListTests,
  adminGetTest,
  adminCreateTest,
  adminUpdateTest,
  adminDeleteTest,
  adminListTestSeries,
  adminGetTestSeries,
  adminCreateTestSeries,
  adminUpdateTestSeries,
  adminDeleteTestSeries,
  adminGetTestAttempts,
  publicListTests,
  publicGetTest,
  publicListTestSeries,
  publicGetTestSeries,
  addTestSeriesReview,
  submitAttempt,
  myAttempts,
  getAttemptResult,
  getCourseTests,
  saveQuestion,
  unsaveQuestion,
  mySavedQuestions,
  reportQuestion,
  myReportedQuestions,
  adminListReportedQuestions,
  adminUpdateReport,
  spendCoinForTest,
  getMyMistakes,
  getRevisionQueue,
  addToRevisionQueue,
  removeFromRevisionQueue,
} from '../controllers/test.controller.js';

const router = Router();

// ─── Public routes (no auth needed for free tests) ───────────────────────────
router.get('/tests', softAuth, publicListTests);
router.get('/tests/:id', softAuth, publicGetTest);
router.get('/series', softAuth, publicListTestSeries);
router.get('/series/:id', softAuth, publicGetTestSeries);
router.post('/series/:id/review', protect, addTestSeriesReview);

// ─── Course-specific tests (free = no auth, paid = enrolled) ─────────────────
router.get('/course/:courseId', softAuth, getCourseTests);

// ─── Student (authenticated) ─────────────────────────────────────────────────
router.post('/attempts', protect, submitAttempt);
router.post('/tests/:id/spend-coin', protect, spendCoinForTest);
router.get('/attempts/me', protect, myAttempts);
router.get('/attempts/:id', protect, getAttemptResult);
// Saved questions
router.post('/saved-questions', protect, saveQuestion);
router.get('/saved-questions', protect, mySavedQuestions);
router.delete('/saved-questions/:questionId', protect, unsaveQuestion);
// Mistakes
router.get('/my-mistakes', protect, getMyMistakes);
// Revision Queue
router.get('/revision-queue', protect, getRevisionQueue);
router.post('/revision-queue', protect, addToRevisionQueue);
router.delete('/revision-queue/:questionId', protect, removeFromRevisionQueue);
// Reported questions
router.post('/reported-questions', protect, reportQuestion);
router.get('/reported-questions/me', protect, myReportedQuestions);

// ─── Admin only ───────────────────────────────────────────────────────────────
router.get('/admin/tests', protect, adminOnly, adminListTests);
router.post('/admin/tests', protect, adminOnly, adminCreateTest);
router.get('/admin/tests/:id', protect, adminOnly, adminGetTest);
router.put('/admin/tests/:id', protect, adminOnly, adminUpdateTest);
router.delete('/admin/tests/:id', protect, adminOnly, adminDeleteTest);
router.get('/admin/tests/:testId/attempts', protect, adminOnly, adminGetTestAttempts);

router.get('/admin/series', protect, adminOnly, adminListTestSeries);
router.post('/admin/series', protect, adminOnly, adminCreateTestSeries);
router.get('/admin/series/:id', protect, adminOnly, adminGetTestSeries);
router.put('/admin/series/:id', protect, adminOnly, adminUpdateTestSeries);
router.delete('/admin/series/:id', protect, adminOnly, adminDeleteTestSeries);

// Admin: reported questions
router.get('/admin/reported-questions', protect, adminOnly, adminListReportedQuestions);
router.put('/admin/reported-questions/:id', protect, adminOnly, adminUpdateReport);

export default router;
