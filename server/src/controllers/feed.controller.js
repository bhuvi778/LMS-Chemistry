import asyncHandler from 'express-async-handler';
import Feed from '../models/Feed.js';

// @desc    Get active feed announcements
// @route   GET /api/feed
// @access  Public
export const getFeed = asyncHandler(async (req, res) => {
  const feeds = await Feed.find({ isActive: true }).sort({ createdAt: -1 });
  res.json(feeds);
});

// @desc    Get all feed items for admin management
// @route   GET /api/feed/admin
// @access  Admin only
export const listFeedsAdmin = asyncHandler(async (req, res) => {
  const feeds = await Feed.find().sort({ createdAt: -1 });
  res.json(feeds);
});

// @desc    Create a new feed item
// @route   POST /api/feed
// @access  Admin only
export const createFeed = asyncHandler(async (req, res) => {
  const { title, content, image, link, isActive } = req.body;
  if (!title || !content) {
    res.status(400);
    throw new Error('Title and content are required');
  }
  const feed = await Feed.create({ title, content, image, link, isActive });
  res.status(201).json(feed);
});

// @desc    Update a feed item
// @route   PUT /api/feed/:id
// @access  Admin only
export const updateFeed = asyncHandler(async (req, res) => {
  const feed = await Feed.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!feed) {
    res.status(404);
    throw new Error('Feed item not found');
  }
  res.json(feed);
});

// @desc    Delete a feed item
// @route   DELETE /api/feed/:id
// @access  Admin only
export const deleteFeed = asyncHandler(async (req, res) => {
  const feed = await Feed.findByIdAndDelete(req.params.id);
  if (!feed) {
    res.status(404);
    throw new Error('Feed item not found');
  }
  res.json({ message: 'Feed item deleted successfully' });
});
