import { Router } from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import {
  submitBankTransfer,
  updateBankTransfer,
  myBankTransfers,
  adminListBankTransfers,
  adminConfirmBankTransfer,
  adminRejectBankTransfer,
  calcHandlingFee,
} from '../controllers/bankTransfer.controller.js';
import asyncHandler from 'express-async-handler';

const router = Router();

// Public fee calculator
router.get('/fee', asyncHandler(async (req, res) => {
  const base = Number(req.query.amount) || 0;
  const fee = calcHandlingFee(base);
  res.json({ baseAmount: base, handlingFee: fee, totalAmount: base + fee });
}));

// Student routes
router.post('/', protect, submitBankTransfer);
router.put('/:id', protect, updateBankTransfer);
router.get('/me', protect, myBankTransfers);

// Admin routes
router.get('/', protect, adminOnly, adminListBankTransfers);
router.post('/:id/confirm', protect, adminOnly, adminConfirmBankTransfer);
router.post('/:id/reject', protect, adminOnly, adminRejectBankTransfer);

export default router;
