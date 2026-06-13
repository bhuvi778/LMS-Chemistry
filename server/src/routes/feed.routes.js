import { Router } from 'express';
import { protect, adminOnly, softAuth } from '../middleware/auth.js';
import {
  getFeed,
  listFeedsAdmin,
  createFeed,
  updateFeed,
  deleteFeed,
  toggleLikeFeed,
  commentFeed,
  deleteCommentFeed,
} from '../controllers/feed.controller.js';

const router = Router();

// Public listing (optionally authenticated)
router.get('/', softAuth, getFeed);

// Interactive features (optionally authenticated)
router.post('/:id/like', softAuth, toggleLikeFeed);
router.post('/:id/comment', softAuth, commentFeed);
router.delete('/:id/comment/:commentId', softAuth, deleteCommentFeed);

// Admin-only management
router.get('/admin', protect, adminOnly, listFeedsAdmin);
router.post('/', protect, adminOnly, createFeed);
router.put('/:id', protect, adminOnly, updateFeed);
router.delete('/:id', protect, adminOnly, deleteFeed);

export default router;
