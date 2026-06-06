import { Router } from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import { getFeed, listFeedsAdmin, createFeed, updateFeed, deleteFeed } from '../controllers/feed.controller.js';

const router = Router();

// Public listing
router.get('/', getFeed);

// Admin-only management
router.get('/admin', protect, adminOnly, listFeedsAdmin);
router.post('/', protect, adminOnly, createFeed);
router.put('/:id', protect, adminOnly, updateFeed);
router.delete('/:id', protect, adminOnly, deleteFeed);

export default router;
