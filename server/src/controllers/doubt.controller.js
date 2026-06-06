import asyncHandler from 'express-async-handler';
import Doubt from '../models/Doubt.js';
import User from '../models/User.js';
import { notifyMany } from './notification.controller.js';
import { sendDoubtAnsweredEmail } from '../services/email.js';

// ─── Student: post a doubt ─────────────────────────────────────────────────
export const createDoubt = asyncHandler(async (req, res) => {
  const { course, subject, question, questionImage } = req.body;
  if (!question?.trim()) { res.status(400); throw new Error('Question is required'); }
  const doubt = await Doubt.create({
    student: req.user._id,
    course: course || null,
    subject,
    question: question.trim(),
    questionImage: questionImage || '',
  });
  res.status(201).json(doubt);
});

// ─── Student: my doubts ────────────────────────────────────────────────────
export const myDoubts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 20;
  const skip = (page - 1) * limit;
  const filter = { student: req.user._id };
  if (req.query.status) filter.status = req.query.status;

  const [doubts, total] = await Promise.all([
    Doubt.find(filter)
      .populate('course', 'title thumbnail')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Doubt.countDocuments(filter),
  ]);
  res.json({ doubts, total, page, pages: Math.ceil(total / limit) });
});

// ─── Admin: list all doubts ────────────────────────────────────────────────
export const adminListDoubts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 30;
  const skip = (page - 1) * limit;
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.course) filter.course = req.query.course;

  const [doubts, total] = await Promise.all([
    Doubt.find(filter)
      .populate('student', 'name email studentId avatar')
      .populate('course', 'title')
      .populate('answeredBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Doubt.countDocuments(filter),
  ]);
  res.json({ doubts, total, page, pages: Math.ceil(total / limit) });
});

// ─── Admin: answer a doubt ─────────────────────────────────────────────────
export const answerDoubt = asyncHandler(async (req, res) => {
  const { answer } = req.body;
  if (!answer?.trim()) { res.status(400); throw new Error('Answer is required'); }

  const doubt = await Doubt.findById(req.params.id).populate('student', 'name email');
  if (!doubt) { res.status(404); throw new Error('Doubt not found'); }

  doubt.answer = answer.trim();
  doubt.answeredBy = req.user._id;
  doubt.answeredAt = new Date();
  doubt.status = 'answered';
  await doubt.save();

  // Notify student in-app
  await notifyMany([doubt.student._id], {
    title: 'Your doubt has been answered!',
    message: doubt.question.substring(0, 80) + (doubt.question.length > 80 ? '...' : ''),
    type: 'system',
    link: '/doubts',
  });

  // Email notification
  if (doubt.student?.email) {
    const courseTitle = doubt.course ? (await import('../models/Course.js').then((m) => m.default.findById(doubt.course).select('title'))).title : 'General';
    sendDoubtAnsweredEmail(
      doubt.student.email,
      doubt.student.name,
      doubt.question,
      answer.trim(),
      courseTitle || 'General'
    ).catch(() => {});
  }

  res.json(doubt);
});

// ─── Admin: update doubt status ────────────────────────────────────────────
export const updateDoubtStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const doubt = await Doubt.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  );
  if (!doubt) { res.status(404); throw new Error('Doubt not found'); }
  res.json(doubt);
});

// ─── Admin: stats ──────────────────────────────────────────────────────────
export const doubtStats = asyncHandler(async (_req, res) => {
  const [total, open, answered] = await Promise.all([
    Doubt.countDocuments(),
    Doubt.countDocuments({ status: 'open' }),
    Doubt.countDocuments({ status: 'answered' }),
  ]);
  res.json({ total, open, answered });
});
