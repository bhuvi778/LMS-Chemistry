import { Router } from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import { getActivePopup, listPopups, createPopup, updatePopup, deletePopup } from '../controllers/popup.controller.js';

const router = Router();

// Public route to fetch the active popup
router.get('/active', getActivePopup);

// Admin-only management routes
router.get('/', protect, adminOnly, listPopups);
router.post('/', protect, adminOnly, createPopup);
router.put('/:id', protect, adminOnly, updatePopup);
router.delete('/:id', protect, adminOnly, deletePopup);

export default router;
