import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import {
  enrollInCourse,
  myEnrollments,
  checkEnrollment,
} from '../controllers/enroll.controller.js';

const router = Router();
router.get('/me', protect, myEnrollments);
router.get('/check/:courseId', protect, checkEnrollment);
router.post('/:courseId', protect, enrollInCourse);
export default router;
