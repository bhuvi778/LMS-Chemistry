import { Router } from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import { getChatHistory, getAdminConversations, getAdminChatHistory, markAdminRead } from '../controllers/chat.controller.js';

const router = Router();

router.use(protect);

// Student routes
router.get('/history', getChatHistory);

// Admin routes
router.get('/admin/conversations', adminOnly, getAdminConversations);
router.get('/admin/history/:studentId', adminOnly, getAdminChatHistory);
router.put('/admin/read/:studentId', adminOnly, markAdminRead);

export default router;
