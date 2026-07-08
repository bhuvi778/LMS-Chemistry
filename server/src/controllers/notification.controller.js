import asyncHandler from 'express-async-handler';
import Notification from '../models/Notification.js';
import NotificationCampaign from '../models/NotificationCampaign.js';
import User from '../models/User.js';
import Enrollment from '../models/Enrollment.js';
import { sendPushToMany } from '../services/firebase.js';

export const myNotifications = asyncHandler(async (req, res) => {
  const list = await Notification.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50);
  const unread = await Notification.countDocuments({ user: req.user._id, read: false });
  res.json({ list, unread });
});

export const markRead = asyncHandler(async (req, res) => {
  await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { read: true }
  );
  res.json({ ok: true });
});

export const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
  res.json({ ok: true });
});

/** Register / update FCM token for the logged-in user */
export const registerFcmToken = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) { res.status(400); throw new Error('FCM token is required'); }
  await User.findByIdAndUpdate(req.user._id, {
    $addToSet: { fcmTokens: token },
  });
  res.json({ ok: true });
});

/** Remove FCM token (on logout / permission revoke) */
export const removeFcmToken = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) { res.status(400); throw new Error('FCM token is required'); }
  await User.findByIdAndUpdate(req.user._id, {
    $pull: { fcmTokens: token },
  });
  res.json({ ok: true });
});

/** Helper: bulk-create notifications + send FCM push */
export const notifyMany = async (userIds, payload) => {
  if (!userIds?.length) return 0;
  const docs = userIds.map((u) => ({ ...payload, user: u }));
  const inserted = await Notification.insertMany(docs);

  // Send FCM push notifications (non-blocking)
  try {
    const users = await User.find({ _id: { $in: userIds }, fcmTokens: { $not: { $size: 0 } } })
      .select('fcmTokens');
    const allTokens = users.flatMap((u) => u.fcmTokens).filter(Boolean);
    if (allTokens.length) {
      sendPushToMany(allTokens, {
        title: payload.title,
        body: payload.message || '',
        link: payload.link || '/',
        image: payload.image || '',
      }).catch(() => {});
    }
  } catch (_) { /* FCM errors must not break DB writes */ }

  return inserted.length;
};

export const broadcastNotification = asyncHandler(async (req, res) => {
  const {
    title,
    message,
    link,
    image,
    target,
    targetUserIds,
    targetCourseId,
    showBuyButton,
    buyCourseId,
    showCallButton,
    callPhoneNumber,
    isDismissable,
    scheduledAt,
    sendLater,
  } = req.body;

  if (!title || !message) {
    res.status(400);
    throw new Error('Title and message are required');
  }

  // Create Campaign first
  const campaign = await NotificationCampaign.create({
    title,
    message,
    link: link || '',
    image: image || '',
    target,
    targetUserIds: target === 'specific' ? targetUserIds : [],
    targetCourseId: target === 'course' ? targetCourseId : null,
    showBuyButton: !!showBuyButton,
    buyCourseId: showBuyButton ? buyCourseId : null,
    showCallButton: !!showCallButton,
    callPhoneNumber: showCallButton ? callPhoneNumber : '',
    isDismissable: isDismissable !== false,
    scheduledAt: sendLater ? new Date(scheduledAt) : null,
    status: sendLater ? 'scheduled' : 'sent',
    deliveryCount: 0,
  });

  let count = 0;
  if (!sendLater) {
    let userIds = [];
    if (target === 'all') {
      const students = await User.find({ role: 'student' }).select('_id');
      userIds = students.map((s) => s._id);
    } else if (target === 'specific' && Array.isArray(targetUserIds)) {
      userIds = targetUserIds;
    } else if (target === 'course' && targetCourseId) {
      const enrolls = await Enrollment.find({ course: targetCourseId, paymentStatus: 'paid' }).select('student');
      userIds = enrolls.map((e) => e.student).filter(Boolean);
    }

    if (userIds.length === 0) {
      // Clean up campaign since no recipients
      await campaign.deleteOne();
      res.status(400);
      throw new Error('No target students found');
    }

    count = await notifyMany(userIds, {
      title,
      message,
      link: link || '',
      image: image || '',
      type: 'alert',
      showBuyButton: !!showBuyButton,
      buyCourseId: showBuyButton ? buyCourseId : null,
      showCallButton: !!showCallButton,
      callPhoneNumber: showCallButton ? callPhoneNumber : '',
      isDismissable: isDismissable !== false,
      campaignId: campaign._id,
    });

    campaign.deliveryCount = count;
    await campaign.save();
  }

  res.json({ success: true, count, campaign });
});

export const getCampaigns = asyncHandler(async (req, res) => {
  const campaigns = await NotificationCampaign.find()
    .populate('buyCourseId', 'title')
    .populate('targetCourseId', 'title')
    .sort({ createdAt: -1 });

  const campaignsWithStats = await Promise.all(
    campaigns.map(async (c) => {
      const readCount = await Notification.countDocuments({ campaignId: c._id, read: true });
      return {
        ...c.toObject(),
        readCount,
      };
    })
  );

  res.json(campaignsWithStats);
});

export const clickNotification = asyncHandler(async (req, res) => {
  const notif = await Notification.findById(req.params.id);
  if (notif && notif.campaignId) {
    await NotificationCampaign.findByIdAndUpdate(notif.campaignId, { $inc: { clicks: 1 } });
  }
  res.json({ ok: true });
});

export const resendCampaign = asyncHandler(async (req, res) => {
  const original = await NotificationCampaign.findById(req.params.id);
  if (!original) {
    res.status(404);
    throw new Error('Campaign not found');
  }

  let userIds = [];
  if (original.target === 'all') {
    const students = await User.find({ role: 'student' }).select('_id');
    userIds = students.map((s) => s._id);
  } else if (original.target === 'specific' && Array.isArray(original.targetUserIds)) {
    userIds = original.targetUserIds;
  } else if (original.target === 'course' && original.targetCourseId) {
    const enrolls = await Enrollment.find({ course: original.targetCourseId, paymentStatus: 'paid' }).select('student');
    userIds = enrolls.map((e) => e.student).filter(Boolean);
  }

  if (userIds.length === 0) {
    res.status(400);
    throw new Error('No target students found for resending');
  }

  const newCampaign = await NotificationCampaign.create({
    title: original.title,
    message: original.message,
    link: original.link,
    image: original.image,
    target: original.target,
    targetUserIds: original.targetUserIds,
    targetCourseId: original.targetCourseId,
    showBuyButton: original.showBuyButton,
    buyCourseId: original.buyCourseId,
    showCallButton: original.showCallButton,
    callPhoneNumber: original.callPhoneNumber,
    isDismissable: original.isDismissable,
    scheduledAt: null,
    status: 'sent',
    deliveryCount: 0,
  });

  const count = await notifyMany(userIds, {
    title: original.title,
    message: original.message,
    link: original.link || '',
    image: original.image || '',
    type: 'alert',
    showBuyButton: original.showBuyButton,
    buyCourseId: original.buyCourseId,
    showCallButton: original.showCallButton,
    callPhoneNumber: original.callPhoneNumber,
    isDismissable: original.isDismissable,
    campaignId: newCampaign._id,
  });

  newCampaign.deliveryCount = count;
  await newCampaign.save();

  res.json({ success: true, count, campaign: newCampaign });
});

export const deleteCampaign = asyncHandler(async (req, res) => {
  const campaign = await NotificationCampaign.findById(req.params.id);
  if (!campaign) {
    res.status(404);
    throw new Error('Campaign not found');
  }
  await Notification.deleteMany({ campaignId: campaign._id });
  await campaign.deleteOne();
  res.json({ success: true });
});
