import { Router } from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import {
  createDoubt,
  myDoubts,
  adminListDoubts,
  answerDoubt,
  updateDoubtStatus,
  doubtStats,
  getDoubtUsage,
  closeDoubt,
} from '../controllers/doubt.controller.js';

const router = Router();
router.use(protect);

// Student routes
router.get('/usage', getDoubtUsage);
router.post('/', createDoubt);
router.get('/my', myDoubts);
router.put('/:id/close', closeDoubt);

// Admin routes
router.get('/admin', adminOnly, adminListDoubts);
router.get('/admin/stats', adminOnly, doubtStats);
router.put('/admin/:id/answer', adminOnly, answerDoubt);
router.put('/admin/:id/status', adminOnly, updateDoubtStatus);

export default router;
