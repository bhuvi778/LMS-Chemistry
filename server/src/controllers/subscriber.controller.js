import asyncHandler from 'express-async-handler';
import Subscriber from '../models/Subscriber.js';

/** POST /api/subscribers — public */
export const subscribeEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400);
    throw new Error('A valid email is required');
  }
  const existing = await Subscriber.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    if (existing.isActive) {
      return res.status(409).json({ message: 'You are already subscribed!' });
    }
    existing.isActive = true;
    await existing.save();
    return res.json({ message: 'Welcome back! You have been re-subscribed.' });
  }
  await Subscriber.create({ email: email.toLowerCase().trim() });
  res.status(201).json({ message: 'Successfully subscribed!' });
});

/** GET /api/subscribers/admin — admin only */
export const getSubscribers = asyncHandler(async (req, res) => {
  const subscribers = await Subscriber.find().sort({ createdAt: -1 });
  res.json({ count: subscribers.length, subscribers });
});

/** DELETE /api/subscribers/:id — admin only */
export const deleteSubscriber = asyncHandler(async (req, res) => {
  const sub = await Subscriber.findByIdAndDelete(req.params.id);
  if (!sub) { res.status(404); throw new Error('Subscriber not found'); }
  res.json({ message: 'Removed' });
});
