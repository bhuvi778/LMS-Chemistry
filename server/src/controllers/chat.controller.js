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
  // Fetch all students
  const students = await User.find({ role: 'student' })
    .select('name email avatar studentId createdAt')
    .sort({ name: 1 })
    .lean();

  // Load the latest message and unread count for each student
  const populated = await Promise.all(
    students.map(async (student) => {
      const lastMessage = await ChatMessage.findOne({
        $or: [
          { sender: student._id, recipient: null },
          { recipient: student._id }
        ]
      })
      .sort({ createdAt: -1 })
      .lean();

      const unreadCount = await ChatMessage.countDocuments({
        sender: student._id,
        recipient: null,
        read: false
      });

      return {
        student,
        lastMessage: lastMessage || { text: 'No messages yet', createdAt: student.createdAt || new Date() },
        unreadCount
      };
    })
  );

  // Sort: students with active chats first, then by last message time
  populated.sort((a, b) => {
    const aHasMsg = a.lastMessage._id ? 1 : 0;
    const bHasMsg = b.lastMessage._id ? 1 : 0;
    if (aHasMsg !== bHasMsg) {
      return bHasMsg - aHasMsg;
    }
    return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt);
  });

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

// @desc    Clear logged-in user's chat history with support (Student)
// @route   DELETE /api/chats/clear
// @access  Private (Student)
export const clearChatHistory = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  await ChatMessage.deleteMany({
    $or: [
      { sender: userId, recipient: null },
      { recipient: userId }
    ]
  });
  res.json({ success: true, message: 'Chat history cleared' });
});

// @desc    Clear chat history with a specific student (Admin)
// @route   DELETE /api/chats/admin/clear/:studentId
// @access  Admin only
export const clearAdminChatHistory = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  await ChatMessage.deleteMany({
    $or: [
      { sender: studentId, recipient: null },
      { recipient: studentId }
    ]
  });
  res.json({ success: true, message: 'Chat history cleared by admin' });
});
