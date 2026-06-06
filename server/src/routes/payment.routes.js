import { Router } from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import {
  createOrder,
  verifyPayment,
  validateCoupon,
  checkSeriesEnrollment,
  mySeriesEnrollments,
  adminListPayments,
  downloadInvoice,
} from '../controllers/payment.controller.js';

const router = Router();

// Student routes (require auth)
router.post('/create-order', protect, createOrder);
router.post('/verify', protect, verifyPayment);
router.post('/validate-coupon', protect, validateCoupon);
router.get('/check-series/:testSeriesId', protect, checkSeriesEnrollment);
router.get('/my-series', protect, mySeriesEnrollments);
router.get('/invoice/:paymentId', protect, downloadInvoice);

// Admin routes
router.get('/admin/all', protect, adminOnly, adminListPayments);

export default router;
