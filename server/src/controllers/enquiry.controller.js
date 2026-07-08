import asyncHandler from 'express-async-handler';
import Enquiry from '../models/Enquiry.js';

// @desc    Submit a contact enquiry
// @route   POST /api/enquiries
// @access  Public
export const createEnquiry = asyncHandler(async (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  if (!name || !email || !message) {
    res.status(400);
    throw new Error('Name, email and message are required');
  }
  const enquiry = await Enquiry.create({ name, email, phone, subject, message });

  try {
    const { sendEnquiryNotificationToAdmin, sendEnquiryReceiptToUser } = await import('../services/email.js');
    sendEnquiryNotificationToAdmin('hello@ace2examz.com', enquiry).catch(() => {});
    sendEnquiryReceiptToUser(enquiry.email, enquiry.name, enquiry).catch(() => {});
  } catch (_) {}

  res.status(201).json({ success: true, data: enquiry });
});

// @desc    Get all enquiries
// @route   GET /api/enquiries
// @access  Admin only
export const listEnquiries = asyncHandler(async (req, res) => {
  const enquiries = await Enquiry.find().sort({ createdAt: -1 });
  res.json(enquiries);
});

// @desc    Update enquiry status
// @route   PUT /api/enquiries/:id
// @access  Admin only
export const updateEnquiry = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const enquiry = await Enquiry.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  );
  if (!enquiry) {
    res.status(404);
    throw new Error('Enquiry not found');
  }
  res.json(enquiry);
});

// @desc    Delete an enquiry
// @route   DELETE /api/enquiries/:id
// @access  Admin only
export const deleteEnquiry = asyncHandler(async (req, res) => {
  const enquiry = await Enquiry.findByIdAndDelete(req.params.id);
  if (!enquiry) {
    res.status(404);
    throw new Error('Enquiry not found');
  }
  res.json({ message: 'Enquiry deleted successfully' });
});
