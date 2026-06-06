import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, default: '' },
    // 'live_class' | 'enrollment' | 'system' | 'announcement'
    type: { type: String, default: 'system' },
    // optional link the user is taken to when clicking
    link: { type: String, default: '' },
    // optional image URL shown in push
    image: { type: String, default: '' },
    // optional reference object id (e.g. live class id)
    refId: { type: mongoose.Schema.Types.ObjectId, default: null },
    read: { type: Boolean, default: false, index: true },
    showBuyButton: { type: Boolean, default: false },
    buyCourseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null },
    showCallButton: { type: Boolean, default: false },
    callPhoneNumber: { type: String, default: '' },
    isDismissable: { type: Boolean, default: true },
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'NotificationCampaign', default: null },
  },
  { timestamps: true }
);

// auto-purge after 60 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 60 });

export default mongoose.model('Notification', notificationSchema);
