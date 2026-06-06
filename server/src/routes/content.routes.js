import { Router } from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import {
  listByType,
  listAllByType,
  createContent,
  updateContent,
  deleteContent,
} from '../controllers/content.controller.js';

const router = Router();
router.get('/:type', listByType);
router.get('/admin/:type', protect, adminOnly, listAllByType);
router.post('/:type', protect, adminOnly, createContent);
router.put('/item/:id', protect, adminOnly, updateContent);
router.delete('/item/:id', protect, adminOnly, deleteContent);
export default router;
