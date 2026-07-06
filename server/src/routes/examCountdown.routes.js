import { Router } from 'express';
import {
  getActiveCountdowns,
  getAllCountdowns,
  createCountdown,
  updateCountdown,
  deleteCountdown
} from '../controllers/examCountdown.controller.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = Router();

// Student / dashboard endpoint (protect to filter by user categories)
router.get('/active', protect, getActiveCountdowns);

// Admin endpoints
router.get('/', protect, adminOnly, getAllCountdowns);
router.post('/', protect, adminOnly, createCountdown);
router.put('/:id', protect, adminOnly, updateCountdown);
router.delete('/:id', protect, adminOnly, deleteCountdown);

export default router;
