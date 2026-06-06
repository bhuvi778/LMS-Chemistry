import express from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import {
  subscribeEmail,
  getSubscribers,
  deleteSubscriber,
} from '../controllers/subscriber.controller.js';

const router = express.Router();

router.post('/', subscribeEmail);
router.get('/admin', protect, adminOnly, getSubscribers);
router.delete('/:id', protect, adminOnly, deleteSubscriber);

export default router;
