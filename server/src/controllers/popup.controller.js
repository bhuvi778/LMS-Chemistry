import asyncHandler from 'express-async-handler';
import Popup from '../models/Popup.js';

// @desc    Get the active popup (there should be only one)
// @route   GET /api/popups/active
// @access  Public
export const getActivePopup = asyncHandler(async (req, res) => {
  const popup = await Popup.findOne({ isActive: true });
  res.json(popup || null);
});

// @desc    Get all popups for admin panel
// @route   GET /api/popups
// @access  Admin only
export const listPopups = asyncHandler(async (req, res) => {
  const popups = await Popup.find().sort({ createdAt: -1 });
  res.json(popups);
});

// @desc    Create a new popup
// @route   POST /api/popups
// @access  Admin only
export const createPopup = asyncHandler(async (req, res) => {
  const { title, description, image, link, buttonText, isActive } = req.body;
  if (!title) {
    res.status(400);
    throw new Error('Title is required');
  }

  // If set to active, deactivate all other popups
  if (isActive) {
    await Popup.updateMany({}, { isActive: false });
  }

  const popup = await Popup.create({ title, description, image, link, buttonText, isActive });
  res.status(201).json(popup);
});

// @desc    Update a popup
// @route   PUT /api/popups/:id
// @access  Admin only
export const updatePopup = asyncHandler(async (req, res) => {
  // If activating this popup, deactivate all other popups
  if (req.body.isActive === true) {
    await Popup.updateMany({ _id: { $ne: req.params.id } }, { isActive: false });
  }

  const popup = await Popup.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!popup) {
    res.status(404);
    throw new Error('Popup not found');
  }
  res.json(popup);
});

// @desc    Delete a popup
// @route   DELETE /api/popups/:id
// @access  Admin only
export const deletePopup = asyncHandler(async (req, res) => {
  const popup = await Popup.findByIdAndDelete(req.params.id);
  if (!popup) {
    res.status(404);
    throw new Error('Popup not found');
  }
  res.json({ message: 'Popup deleted successfully' });
});
