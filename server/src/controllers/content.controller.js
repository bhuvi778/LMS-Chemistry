import asyncHandler from 'express-async-handler';
import Content from '../models/Content.js';

export const listByType = asyncHandler(async (req, res) => {
  const { type } = req.params;
  const items = await Content.find({ type, isActive: true }).sort({ order: 1, createdAt: -1 });
  res.json(items);
});

export const listAllByType = asyncHandler(async (req, res) => {
  const { type } = req.params;
  const items = await Content.find({ type }).sort({ order: 1, createdAt: -1 });
  res.json(items);
});

export const createContent = asyncHandler(async (req, res) => {
  const { type } = req.params;
  const item = await Content.create({ ...req.body, type });
  res.status(201).json(item);
});

export const updateContent = asyncHandler(async (req, res) => {
  const item = await Content.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!item) {
    res.status(404);
    throw new Error('Content not found');
  }
  res.json(item);
});

export const deleteContent = asyncHandler(async (req, res) => {
  const item = await Content.findByIdAndDelete(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error('Content not found');
  }
  res.json({ message: 'Deleted' });
});
