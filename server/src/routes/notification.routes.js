import { Router } from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import {
  myNotifications,
  markRead,
  markAllRead,
  registerFcmToken,
  removeFcmToken,
  broadcastNotification,
  getCampaigns,
  resendCampaign,
  deleteCampaign,
  clickNotification
} from '../controllers/notification.controller.js';

const router = Router();
router.use(protect);
router.get('/', myNotifications);
router.put('/read-all', markAllRead);
router.put('/:id/read', markRead);
router.put('/:id/click', clickNotification);
router.post('/fcm-token', registerFcmToken);
router.delete('/fcm-token', removeFcmToken);

// Admin campaign management
router.post('/send', adminOnly, broadcastNotification);
router.get('/campaigns', adminOnly, getCampaigns);
router.post('/campaigns/:id/resend', adminOnly, resendCampaign);
router.delete('/campaigns/:id', adminOnly, deleteCampaign);

export default router;
