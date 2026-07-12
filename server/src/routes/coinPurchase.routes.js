import { Router } from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import {
  submitCoinPurchase,
  updateCoinPurchase,
  myCoinPurchases,
  adminListCoinPurchases,
  adminApproveCoinPurchase,
  adminRejectCoinPurchase,
  createCoinRazorpayOrder,
  verifyCoinRazorpayPayment,
  downloadCoinPurchaseInvoice,
} from '../controllers/coinPurchase.controller.js';

const router = Router();

// Student routes (accessible to any logged-in user)
router.post('/', protect, submitCoinPurchase);
router.put('/:id', protect, updateCoinPurchase);
router.get('/me', protect, myCoinPurchases);
router.get('/invoice/:id', protect, downloadCoinPurchaseInvoice);

// Razorpay routes for direct coin purchase
router.post('/razorpay/create-order', protect, createCoinRazorpayOrder);
router.post('/razorpay/verify', protect, verifyCoinRazorpayPayment);

// Admin-only routes
router.get('/admin', protect, adminOnly, adminListCoinPurchases);
router.post('/admin/:id/approve', protect, adminOnly, adminApproveCoinPurchase);
router.post('/admin/:id/reject', protect, adminOnly, adminRejectCoinPurchase);

export default router;
