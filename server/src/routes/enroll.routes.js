import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import {
  enrollInCourse,
  myEnrollments,
  checkEnrollment,
  pauseEnrollment,
  resumeEnrollment,
  updateWatchHistory,
  getWatchHistory,
  myTestSeriesEnrollments,
} from '../controllers/enroll.controller.js';

const router = Router();
router.get('/me', protect, myEnrollments);
router.get('/test-series/me', protect, myTestSeriesEnrollments);
router.get('/check/:courseId', protect, checkEnrollment);
router.post('/pause/:enrollmentId', protect, pauseEnrollment);
router.post('/resume/:enrollmentId', protect, resumeEnrollment);
router.post('/watch-history', protect, updateWatchHistory);
router.get('/watch-history', protect, getWatchHistory);
router.post('/:courseId', protect, enrollInCourse);

export default router;

