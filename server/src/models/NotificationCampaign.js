import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String, default: '' },
    image: { type: String, default: '' },
    target: { type: String, enum: ['all', 'specific'], default: 'all' },
    targetUserIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    showBuyButton: { type: Boolean, default: false },
    buyCourseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null },
    showCallButton: { type: Boolean, default: false },
    callPhoneNumber: { type: String, default: '' },
    isDismissable: { type: Boolean, default: true },
    scheduledAt: { type: Date, default: null },
    status: { type: String, enum: ['sent', 'scheduled'], default: 'sent' },
    clicks: { type: Number, default: 0 },
    deliveryCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('NotificationCampaign', campaignSchema);
