import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { getStudentProgress, completeStudentTask } from '../controllers/powerCourse.controller.js';

const router = Router();

router.use(protect);

router.get('/progress/:courseId', getStudentProgress);
router.post('/progress/:courseId/complete-task', completeStudentTask);

export default router;
