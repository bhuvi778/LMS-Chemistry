import asyncHandler from 'express-async-handler';
import Feed from '../models/Feed.js';

// @desc    Get active feed announcements
// @route   GET /api/feed
// @access  Public (Optionally authenticated)
export const getFeed = asyncHandler(async (req, res) => {
  const feeds = await Feed.find({ isActive: true })
    .populate('comments.user', 'name avatar')
    .populate('likes.user', 'name avatar')
    .sort({ createdAt: -1 });
  res.json(feeds);
});

// @desc    Get all feed items for admin management
// @route   GET /api/feed/admin
// @access  Admin only
export const listFeedsAdmin = asyncHandler(async (req, res) => {
  const feeds = await Feed.find()
    .populate('comments.user', 'name avatar')
    .populate('likes.user', 'name avatar')
    .sort({ createdAt: -1 });
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

// @desc    Toggle like on a feed item
// @route   POST /api/feed/:id/like
// @access  Public (Optionally authenticated)
export const toggleLikeFeed = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const feed = await Feed.findById(id);

  if (!feed) {
    res.status(404);
    throw new Error('Feed item not found');
  }

  if (req.user) {
    // Registered user like
    const userId = req.user._id.toString();
    const existingLikeIdx = feed.likes.findIndex(
      (like) => like.user && like.user.toString() === userId
    );

    if (existingLikeIdx > -1) {
      feed.likes.splice(existingLikeIdx, 1);
    } else {
      feed.likes.push({ user: req.user._id });
    }
  } else {
    // Guest like
    const { guestId } = req.body;
    if (!guestId) {
      res.status(400);
      throw new Error('guestId is required for guest likes');
    }
    const existingLikeIdx = feed.likes.findIndex(
      (like) => like.guestId === guestId
    );

    if (existingLikeIdx > -1) {
      feed.likes.splice(existingLikeIdx, 1);
    } else {
      feed.likes.push({ guestId });
    }
  }

  await feed.save();
  const updatedFeed = await Feed.findById(id)
    .populate('comments.user', 'name avatar')
    .populate('likes.user', 'name avatar');
  res.json(updatedFeed);
});

// @desc    Comment on a feed item
// @route   POST /api/feed/:id/comment
// @access  Public (Optionally authenticated)
export const commentFeed = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { content, userName, guestId } = req.body;

  if (!content) {
    res.status(400);
    throw new Error('Comment content is required');
  }

  const feed = await Feed.findById(id);
  if (!feed) {
    res.status(404);
    throw new Error('Feed item not found');
  }

  if (req.user) {
    // Registered user comment
    feed.comments.push({
      user: req.user._id,
      userName: req.user.name,
      content,
    });
  } else {
    // Guest comment
    if (!guestId) {
      res.status(400);
      throw new Error('guestId is required for guest comments');
    }
    feed.comments.push({
      userName: userName || 'Guest',
      guestId,
      content,
    });
  }

  await feed.save();
  const updatedFeed = await Feed.findById(id)
    .populate('comments.user', 'name avatar')
    .populate('likes.user', 'name avatar');
  res.json(updatedFeed);
});

// @desc    Delete comment on a feed item
// @route   DELETE /api/feed/:id/comment/:commentId
// @access  Public (Optionally authenticated or Admin)
export const deleteCommentFeed = asyncHandler(async (req, res) => {
  const { id, commentId } = req.params;
  const { guestId } = req.body; // In case of guest comment deletion request

  const feed = await Feed.findById(id);
  if (!feed) {
    res.status(404);
    throw new Error('Feed item not found');
  }

  const comment = feed.comments.id(commentId);
  if (!comment) {
    res.status(404);
    throw new Error('Comment not found');
  }

  // Authorization check
  const isAdmin = req.user && req.user.role === 'admin';
  const isOwner = req.user && comment.user && comment.user.toString() === req.user._id.toString();
  const isGuestOwner = guestId && comment.guestId === guestId;

  if (!isAdmin && !isOwner && !isGuestOwner) {
    res.status(403);
    throw new Error('Not authorized to delete this comment');
  }

  comment.deleteOne();
  await feed.save();

  const updatedFeed = await Feed.findById(id)
    .populate('comments.user', 'name avatar')
    .populate('likes.user', 'name avatar');
  res.json(updatedFeed);
});
