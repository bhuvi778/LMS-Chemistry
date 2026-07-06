import asyncHandler from 'express-async-handler';
import ExamCountdown from '../models/ExamCountdown.js';
import Enrollment from '../models/Enrollment.js';

// Get active countdowns for a student (filtered by their enrolled course categories)
export const getActiveCountdowns = asyncHandler(async (req, res) => {
  let categories = [];
  if (req.user) {
    const enrollments = await Enrollment.find({ student: req.user._id }).populate('course');
    enrollments.forEach(e => {
      if (e.course) {
        if (e.course.category) categories.push(e.course.category);
        if (e.course.categories && Array.isArray(e.course.categories)) {
          e.course.categories.forEach(cat => categories.push(cat));
        }
      }
    });
    categories = [...new Set(categories)];
  }

  let query = { isActive: true };
  if (categories.length > 0) {
    query.category = { $in: categories };
  }

  const list = await ExamCountdown.find(query).sort({ examDate: 1 });
  res.json(list);
});

// Get all countdowns (admin)
export const getAllCountdowns = asyncHandler(async (req, res) => {
  const list = await ExamCountdown.find().sort({ examDate: 1 });
  res.json(list);
});

// Create countdown
export const createCountdown = asyncHandler(async (req, res) => {
  const { examName, examDate, description, isActive, category, color, icon } = req.body;

  if (isActive !== false) {
    const activeCount = await ExamCountdown.countDocuments({ category, isActive: true });
    if (activeCount >= 3) {
      res.status(400);
      throw new Error(`A category can have a maximum of 3 active counters. Category '${category}' already has 3 active counters.`);
    }
  }

  const countdown = new ExamCountdown({
    examName,
    examDate,
    description,
    isActive,
    category,
    color,
    icon
  });

  await countdown.save();
  res.status(201).json(countdown);
});

// Update countdown
export const updateCountdown = asyncHandler(async (req, res) => {
  const { examName, examDate, description, isActive, category, color, icon } = req.body;
  const { id } = req.params;

  const existing = await ExamCountdown.findById(id);
  if (!existing) {
    res.status(404);
    throw new Error('Countdown not found');
  }

  if (isActive === true && (existing.isActive !== true || existing.category !== category)) {
    const activeCount = await ExamCountdown.countDocuments({ category, isActive: true, _id: { $ne: id } });
    if (activeCount >= 3) {
      res.status(400);
      throw new Error(`A category can have a maximum of 3 active counters. Category '${category}' already has 3 active counters.`);
    }
  }

  existing.examName = examName !== undefined ? examName : existing.examName;
  existing.examDate = examDate !== undefined ? examDate : existing.examDate;
  existing.description = description !== undefined ? description : existing.description;
  existing.isActive = isActive !== undefined ? isActive : existing.isActive;
  existing.category = category !== undefined ? category : existing.category;
  existing.color = color !== undefined ? color : existing.color;
  existing.icon = icon !== undefined ? icon : existing.icon;

  await existing.save();
  res.json(existing);
});

// Delete countdown
export const deleteCountdown = asyncHandler(async (req, res) => {
  const countdown = await ExamCountdown.findByIdAndDelete(req.params.id);
  if (!countdown) {
    res.status(404);
    throw new Error('Countdown not found');
  }
  res.json({ message: 'Countdown deleted successfully' });
});
