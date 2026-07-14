import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { getDashboardDailyTargets, getStudentProgress, completeStudentTask } from '../controllers/powerCourse.controller.js';

const router = Router();

router.use(protect);

router.get('/daily-targets', getDashboardDailyTargets);
router.get('/progress/:courseId', getStudentProgress);
router.post('/progress/:courseId/complete-task', completeStudentTask);

export default router;
