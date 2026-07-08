import NotificationCampaign from '../models/NotificationCampaign.js';
import User from '../models/User.js';
import Enrollment from '../models/Enrollment.js';
import { notifyMany } from '../controllers/notification.controller.js';

export function startNotificationScheduler() {
  // Check every 30 seconds
  setInterval(async () => {
    try {
      const now = new Date();
      const pendingCampaigns = await NotificationCampaign.find({
        status: 'scheduled',
        scheduledAt: { $lte: now },
      });

      for (const campaign of pendingCampaigns) {
        console.log(`[Scheduler] Dispatching scheduled campaign: ${campaign.title}`);
        
        let userIds = [];
        if (campaign.target === 'all') {
          const students = await User.find({ role: 'student' }).select('_id');
          userIds = students.map((s) => s._id);
        } else if (campaign.target === 'specific' && Array.isArray(campaign.targetUserIds)) {
          userIds = campaign.targetUserIds;
        } else if (campaign.target === 'course' && campaign.targetCourseId) {
          const enrolls = await Enrollment.find({ course: campaign.targetCourseId, paymentStatus: 'paid' }).select('student');
          userIds = enrolls.map((e) => e.student).filter(Boolean);
        }

        if (userIds.length > 0) {
          const count = await notifyMany(userIds, {
            title: campaign.title,
            message: campaign.message,
            link: campaign.link || '',
            image: campaign.image || '',
            type: 'alert',
            showBuyButton: campaign.showBuyButton,
            buyCourseId: campaign.buyCourseId,
            showCallButton: campaign.showCallButton,
            callPhoneNumber: campaign.callPhoneNumber,
            isDismissable: campaign.isDismissable,
            campaignId: campaign._id,
          });

          campaign.deliveryCount = count;
          campaign.status = 'sent';
          await campaign.save();
          console.log(`[Scheduler] Dispatched successfully to ${count} students.`);
        } else {
          // If no recipients, mark sent with 0 count
          campaign.status = 'sent';
          campaign.deliveryCount = 0;
          await campaign.save();
          console.log(`[Scheduler] No recipients found. Marked campaign as sent.`);
        }
      }
    } catch (err) {
      console.error('[Scheduler] Error processing scheduled notifications:', err.message);
    }
  }, 30000);
}
