import asyncHandler from 'express-async-handler';
import Category from '../models/Category.js';

const DEFAULT_CATEGORIES = [
  { name: 'CBSE', subcategories: ['Class 11', 'Class 12'] },
  { name: 'NEET', subcategories: ['Physics', 'Chemistry', 'Biology', 'Full Syllabus'] },
  { name: 'JEE', subcategories: ['JEE Main', 'JEE Advanced', 'Full Syllabus'] },
];

export const listCategories = asyncHandler(async (_req, res) => {
  let cats = await Category.find().sort({ name: 1 });
  // Auto-seed defaults if none exist
  if (cats.length === 0) {
    cats = await Category.insertMany(DEFAULT_CATEGORIES);
  }
  res.json(cats);
});

export const createCategory = asyncHandler(async (req, res) => {
  const cat = await Category.create(req.body);
  res.status(201).json(cat);
});

export const updateCategory = asyncHandler(async (req, res) => {
  const cat = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!cat) {
    res.status(404);
    throw new Error('Category not found');
  }
  res.json(cat);
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const cat = await Category.findByIdAndDelete(req.params.id);
  if (!cat) {
    res.status(404);
    throw new Error('Category not found');
  }
  res.json({ message: 'Category deleted' });
});
