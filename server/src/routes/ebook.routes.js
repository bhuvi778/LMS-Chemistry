import { Router } from 'express';
import { protect, adminOnly, softAuth } from '../middleware/auth.js';
import {
  listEbooks,
  downloadEbook,
  adminListEbooks,
  createEbook,
  updateEbook,
  deleteEbook,
} from '../controllers/ebook.controller.js';

const router = Router();

// Student routes (soft auth to check enrollment)
router.get('/', softAuth, listEbooks);
router.get('/:id/download', protect, downloadEbook);

// Admin routes
router.get('/admin/all', protect, adminOnly, adminListEbooks);
router.post('/', protect, adminOnly, createEbook);
router.put('/:id', protect, adminOnly, updateEbook);
router.delete('/:id', protect, adminOnly, deleteEbook);

export default router;
