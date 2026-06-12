import { Router } from 'express';
import {
  register, login, verifyOtp, me, updateMe, logout,
  getSessions, revokeSession, revokeAllSessions,
  toggle2FA, verify2FAEnable,
  verifyEmailSignup, forgotPassword, resetPassword,
  redeemCoins, streakPing, googleAuth, deleteMe, getCoinRedemptions,
  sendLoginOtp, verifyLoginOtp,
} from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// Public
router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/login-otp-request', sendLoginOtp);

// OTP-protected (uses tempToken from login response)
router.post('/verify-otp', protect, verifyOtp);
router.post('/verify-email', protect, verifyEmailSignup);
router.post('/login-otp-verify', protect, verifyLoginOtp);

// Authenticated
router.get('/me', protect, me);
router.put('/me', protect, updateMe);
router.delete('/delete-account', protect, deleteMe);
router.post('/redeem', protect, redeemCoins);
router.get('/coin-redemptions', protect, getCoinRedemptions);
router.post('/streak-ping', protect, streakPing);
router.post('/logout', protect, logout);

// Session management
router.get('/sessions', protect, getSessions);
router.delete('/sessions', protect, revokeAllSessions);
router.delete('/sessions/:id', protect, revokeSession);

// 2FA management
router.put('/2fa', protect, toggle2FA);
router.post('/2fa/verify', protect, verify2FAEnable);

export default router;

