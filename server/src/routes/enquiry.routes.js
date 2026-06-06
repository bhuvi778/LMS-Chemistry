import { Router } from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import { createEnquiry, listEnquiries, updateEnquiry, deleteEnquiry } from '../controllers/enquiry.controller.js';

const router = Router();

// Public submission
router.post('/', createEnquiry);

// Admin-only operations
router.get('/', protect, adminOnly, listEnquiries);
router.put('/:id', protect, adminOnly, updateEnquiry);
router.delete('/:id', protect, adminOnly, deleteEnquiry);

export default router;
