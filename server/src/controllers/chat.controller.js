import asyncHandler from 'express-async-handler';
import ChatMessage from '../models/ChatMessage.js';
import User from '../models/User.js';

// @desc    Get logged-in user's chat history with support
// @route   GET /api/chats/history
// @access  Private (Student/Admin)
export const getChatHistory = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Retrieve all messages between this user and support
  const messages = await ChatMessage.find({
    $or: [
      { sender: userId, recipient: null },
      { recipient: userId }
    ]
  }).sort({ createdAt: 1 });

  // Mark all support messages to this student as read
  await ChatMessage.updateMany(
    { recipient: userId, read: false },
    { $set: { read: true } }
  );

  res.json(messages);
});

// @desc    Get all conversations list for admin
// @route   GET /api/chats/admin/conversations
// @access  Admin only
export const getAdminConversations = asyncHandler(async (req, res) => {
  const conversations = await ChatMessage.aggregate([
    // Project the student identifier
    {
      $project: {
        sender: 1,
        recipient: 1,
        text: 1,
        read: 1,
        createdAt: 1,
        studentId: {
          $cond: {
            if: { $eq: [{ $ifNull: ["$recipient", null] }, null] },
            then: "$sender",
            else: "$recipient"
          }
        }
      }
    },
    // Group by studentId
    {
      $group: {
        _id: "$studentId",
        lastMessage: { $last: "$$ROOT" },
        unreadCount: {
          $sum: {
            $cond: {
              if: {
                $and: [
                  { $eq: [{ $ifNull: ["$recipient", null] }, null] },
                  { $eq: ["$read", false] }
                ]
              },
              then: 1,
              else: 0
            }
          }
        }
      }
    },
    // Sort by last message time
    { $sort: { "lastMessage.createdAt": -1 } }
  ]);

  // Populate user information manually for the grouped results
  const populated = await Promise.all(
    conversations.map(async (c) => {
      const user = await User.findById(c._id).select('name email avatar studentId');
      return {
        student: user || { name: 'Unknown Student', email: '' },
        lastMessage: c.lastMessage,
        unreadCount: c.unreadCount,
      };
    })
  );

  res.json(populated);
});

// @desc    Get chat history with a specific student (Admin view)
// @route   GET /api/chats/admin/history/:studentId
// @access  Admin only
export const getAdminChatHistory = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  const messages = await ChatMessage.find({
    $or: [
      { sender: studentId, recipient: null },
      { recipient: studentId }
    ]
  }).sort({ createdAt: 1 });

  // Mark student's messages as read by admin
  await ChatMessage.updateMany(
    { sender: studentId, recipient: null, read: false },
    { $set: { read: true } }
  );

  res.json(messages);
});

// @desc    Mark a student's messages to support as read
// @route   PUT /api/chats/admin/read/:studentId
// @access  Admin only
export const markAdminRead = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  await ChatMessage.updateMany(
    { sender: studentId, recipient: null, read: false },
    { $set: { read: true } }
  );
  res.json({ success: true });
});
