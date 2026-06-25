import { Router } from 'express';
import cors from 'cors';
import {
  listCourses,
  listPublicCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  getCategories,
  addReview,
  duplicateCourse,
} from '../controllers/course.controller.js';
import { protect, adminOnly, softAuth } from '../middleware/auth.js';

const router = Router();
router.get('/', softAuth, listCourses);
router.get('/categories', getCategories);
router.get('/public', cors({ origin: '*' }), listPublicCourses);
router.get('/:id', getCourse);
router.post('/', protect, adminOnly, createCourse);
router.post('/:id/duplicate', protect, adminOnly, duplicateCourse);
router.put('/:id', protect, adminOnly, updateCourse);
router.delete('/:id', protect, adminOnly, deleteCourse);
router.post('/:id/review', protect, addReview);
export default router;
