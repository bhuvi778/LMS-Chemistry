import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { getLiveClass } from '../controllers/liveClass.controller.js';

const router = Router();
router.use(protect);
router.get('/:id', getLiveClass);
export default router;
