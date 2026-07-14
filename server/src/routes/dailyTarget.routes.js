import { Router } from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import {
  adminCreateDailyTarget,
  adminDeleteDailyTarget,
  adminListDailyTargets,
  adminUpdateDailyTarget,
  completeMyDailyTarget,
  getDailyTargetTest,
  getMyDailyTargets,
} from '../controllers/dailyTarget.controller.js';

const router = Router();

router.get('/me', protect, getMyDailyTargets);
router.get('/:id/start', protect, getDailyTargetTest);
router.post('/:id/complete', protect, completeMyDailyTarget);

router.get('/admin', protect, adminOnly, adminListDailyTargets);
router.post('/admin', protect, adminOnly, adminCreateDailyTarget);
router.put('/admin/:id', protect, adminOnly, adminUpdateDailyTarget);
router.delete('/admin/:id', protect, adminOnly, adminDeleteDailyTarget);

export default router;
