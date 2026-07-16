import { Router } from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import {
  stats,
  statsDetail,
  allStudents,
  createStudent,
  getStudent,
  updateStudent,
  resetStudentPassword,
  revokeStudentSessions,
  impersonateStudent,
  adminEnrollStudent,
  adminRemoveEnrollment,
  adminRemoveEnrollmentById,
  adminEnrollTestSeries,
  adminRemoveTestSeriesEnrollment,
  allEnrollments,
  adminExtendEnrollmentValidity,
  getLiveClasses,
  createLiveClass,
  updateLiveClass,
  deleteLiveClass,
  upcomingLiveClasses,
  liveClassesForCourse,
  allLiveClassesForStudent,
  getCourseRatings,
  deleteCourseRating,
  getStreakStats,
  getWalletStats,
  getReferralStats,
  adminAddCoins,
  adminResetStreak,
  adminFreezeStreak,
  deleteStudent,
  revokeStudentSessionSingle,
  getGlobalSettings,
  updateGlobalSettings,
  incrementAppDownloads,
  getLoginAnalytics,
} from '../controllers/admin.controller.js';
import { getConductedClasses } from '../controllers/recording.controller.js';

const router = Router();
router.use(protect);

// Available to any logged-in user
router.get('/live-classes/upcoming', upcomingLiveClasses);
router.get('/live-classes/all', allLiveClassesForStudent);
router.get('/live-classes/by-course/:courseId', liveClassesForCourse);
router.post('/analytics/app-download', incrementAppDownloads);

// Admin-only below
router.use(adminOnly);
router.get('/stats', stats);
router.get('/stats/detail', statsDetail);
router.get('/settings', getGlobalSettings);
router.put('/settings', updateGlobalSettings);
router.get('/login-analytics', getLoginAnalytics);

// ── Gamification Stats (must be before /:id param routes to avoid conflict) ──
router.get('/gamification/streak', getStreakStats);
router.get('/gamification/wallet', getWalletStats);
router.get('/gamification/referrals', getReferralStats);

// ── Students ──
router.get('/students', allStudents);
router.post('/students', createStudent);
router.get('/students/:id', getStudent);
router.put('/students/:id', updateStudent);
router.delete('/students/:id', deleteStudent);
router.put('/students/:id/reset-password', resetStudentPassword);
router.post('/students/:id/impersonate', impersonateStudent);
router.post('/students/:id/enroll', adminEnrollStudent);
router.delete('/students/:id/enrollments/:enrollmentId', adminRemoveEnrollmentById);
router.delete('/students/:id/enroll/:courseId', adminRemoveEnrollment);
router.post('/students/:id/enroll-test-series', adminEnrollTestSeries);
router.delete('/students/:id/enroll-test-series/:seriesId', adminRemoveTestSeriesEnrollment);
router.delete('/students/:id/sessions', revokeStudentSessions);
router.delete('/students/:id/sessions/:sessionId', revokeStudentSessionSingle);
router.post('/students/:id/add-coins', adminAddCoins);
router.post('/students/:id/reset-streak', adminResetStreak);
router.post('/students/:id/freeze-streak', adminFreezeStreak);

router.get('/enrollments', allEnrollments);
router.put('/enrollments/:id/extend', adminExtendEnrollmentValidity);

router.get('/live-classes', getLiveClasses);
router.get('/live-classes/conducted', getConductedClasses);
router.post('/live-classes', createLiveClass);
router.put('/live-classes/:id', updateLiveClass);
router.delete('/live-classes/:id', deleteLiveClass);

router.get('/ratings', getCourseRatings);
router.delete('/ratings/:courseId/review/:reviewId', deleteCourseRating);

export default router;
