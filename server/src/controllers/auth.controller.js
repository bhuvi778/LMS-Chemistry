import crypto from 'crypto';
import asyncHandler from 'express-async-handler';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import User from '../models/User.js';
import Session from '../models/Session.js';
import OTP from '../models/OTP.js';
import SystemSetting from '../models/SystemSetting.js';
import CoinRedemption from '../models/CoinRedemption.js';
import { signToken } from '../middleware/auth.js';
import { sendWelcomeEmail } from '../services/email.js';
import { sendSmsOtp, sendWhatsappOtp } from '../services/smsWhatsapp.js';

// ─── helpers ────────────────────────────────────────────────────────────────
const genStudentId = () =>
  'CHEM' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 90 + 10);

/** SHA-256 of the raw JWT to store as session key */
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const updateUserStreakAndCoins = async (user) => {
  if (user.role !== 'student') return user;

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const lastLogin = user.lastLoginDate;
  if (!lastLogin) {
    user.streak = 1;
    user.longestStreak = 1;
    user.coins = (user.coins || 0) + 1;
    user.activeDays = [todayStr];
    user.lastLoginDate = now;
    await user.save();
  } else {
    const lastLoginStr = new Date(lastLogin).toISOString().split('T')[0];
    if (lastLoginStr !== todayStr) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastLoginStr === yesterdayStr) {
        user.streak = (user.streak || 0) + 1;
        if (user.streak > (user.longestStreak || 0)) {
          user.longestStreak = user.streak;
        }
        user.coins = (user.coins || 0) + 1;
      } else {
        user.streak = 1;
        user.coins = (user.coins || 0) + 1;
      }

      if (!user.activeDays.includes(todayStr)) {
        user.activeDays.push(todayStr);
      }
      user.lastLoginDate = now;
      await user.save();
    }
  }
  return user;
};

/** Safe user object to return to client */
const safeUser = (user) => ({
  _id: user._id,
  studentId: user.studentId,
  name: user.name,
  email: user.email,
  phone: user.phone || '',
  avatar: user.avatar || '',
  role: user.role,
  twoFactorEnabled: user.twoFactorEnabled || false,
  twoFactorMethod: user.twoFactorMethod || 'none',
  createdAt: user.createdAt,
  // Academic details
  grade: user.grade || '',
  stream: user.stream || '',
  board: user.board || '',
  exams: user.exams || '',
  language: user.language || '',
  city: user.city || '',
  // Streak & Wallet
  coins: user.coins || 0,
  streak: user.streak || 0,
  longestStreak: user.longestStreak || 0,
  activeDays: user.activeDays || [],
  lastLoginDate: user.lastLoginDate,
  streakFrozen: user.streakFrozen || false,
  // Referral
  referredBy: user.referredBy || '',
  referralCount: user.referralCount || 0,
});

/** Parse User-Agent into readable device string */
const parseDevice = (req) => {
  const ua = req.headers['user-agent'] || '';
  if (/iPhone|iPad/i.test(ua)) return 'iOS Device';
  if (/Android/i.test(ua)) return 'Android Device';
  if (/Windows/i.test(ua)) return 'Windows PC';
  if (/Mac/i.test(ua)) return 'Mac';
  if (/Linux/i.test(ua)) return 'Linux PC';
  return 'Unknown Device';
};

/** Get client IP */
const clientIp = (req) =>
  (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
  req.socket?.remoteAddress ||
  '';

/** Create/persist a session, enforcing the per-user max */
const createSession = async (userId, token, req) => {
  const user = await User.findById(userId);
  const globalSetting = await SystemSetting.findOne({ key: 'maxSessions' });
  const globalMax = globalSetting && globalSetting.value !== undefined ? Number(globalSetting.value) : 5;
  const maxSessions = user && user.maxSessions !== undefined ? user.maxSessions : globalMax;
  
  const count = await Session.countDocuments({ userId, isActive: true });
  if (count >= maxSessions) {
    const oldest = await Session.findOne({ userId, isActive: true }).sort({ createdAt: 1 });
    if (oldest) await Session.findByIdAndDelete(oldest._id);
  }
  const session = await Session.create({
    userId,
    tokenHash: hashToken(token),
    deviceInfo: parseDevice(req),
    ip: clientIp(req),
    lastActive: new Date(),
  });

  if (user && user.email) {
    const { sendLoginNotificationEmail } = await import('../services/email.js');
    sendLoginNotificationEmail(user.email, user.name, session.deviceInfo, session.ip).catch(() => {});
  }

  return session;
};

/** Email transporter */
const getTransporter = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER || '', pass: process.env.SMTP_PASS || '' },
  });

/** Send OTP email (falls back to console.log in dev if SMTP not configured) */
const sendOtpEmail = async (email, code, name = '') => {
  const fromEmail = process.env.SMTP_USER || process.env.FROM_EMAIL;
  if (!process.env.SMTP_USER) {
    console.log(`[OTP DEV] ${email} → ${code}`);
    return;
  }
  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"Ace2Examz Security" <${fromEmail}>`,
    to: email,
    subject: 'Your Ace2Examz login OTP',
    html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto">
      <h2 style="color:#6d28d9">Ace2Examz — Login OTP</h2>
      <p>Hi ${name || 'there'},</p>
      <p>Your one-time login code is:</p>
      <div style="font-size:36px;font-weight:900;letter-spacing:8px;color:#6d28d9;margin:20px 0">${code}</div>
      <p style="color:#888">Expires in <b>10 minutes</b>. Do not share it.</p>
    </div>`,
  });
};

const sendVerificationEmail = async (email, code, name = '') => {
  const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER;
  if (!process.env.SMTP_USER) {
    console.log(`[VERIFY DEV] ${email} → ${code}`);
    return;
  }
  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"Ace2Examz Support" <${fromEmail}>`,
    to: email,
    subject: 'Verify Your Email — Ace2Examz',
    html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto">
      <h2 style="color:#6d28d9">Ace2Examz — Email Verification</h2>
      <p>Hi ${name || 'there'},</p>
      <p>Thank you for signing up. Please verify your email using the following 6-digit OTP:</p>
      <div style="font-size:36px;font-weight:900;letter-spacing:8px;color:#6d28d9;margin:20px 0">${code}</div>
      <p style="color:#888">Expires in <b>10 minutes</b>. Do not share it.</p>
    </div>`,
  });
};

const sendResetPasswordOtpEmail = async (email, code, name = '') => {
  const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER;
  if (!process.env.SMTP_USER) {
    console.log(`[RESET DEV] ${email} → ${code}`);
    return;
  }
  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"Ace2Examz Security" <${fromEmail}>`,
    to: email,
    subject: 'Reset Your Password — Ace2Examz',
    html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto">
      <h2 style="color:#6d28d9">Ace2Examz — Password Reset OTP</h2>
      <p>Hi ${name || 'there'},</p>
      <p>You requested to reset your password. Please use the following 6-digit OTP code:</p>
      <div style="font-size:36px;font-weight:900;letter-spacing:8px;color:#6d28d9;margin:20px 0">${code}</div>
      <p style="color:#888">Expires in <b>10 minutes</b>. If you did not request this, please ignore this email.</p>
    </div>`,
  });
};

// ─── controllers ─────────────────────────────────────────────────────────────

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, referralCode } = req.body;
  if (!name || !email || !password || !phone) {
    res.status(400);
    throw new Error('Name, email, password and WhatsApp number are required');
  }
  const exists = await User.findOne({ email });
  if (exists) {
    res.status(400);
    throw new Error('Email already registered');
  }
  const phoneExists = await User.findOne({ phone });
  if (phoneExists) {
    res.status(400);
    throw new Error('WhatsApp number already registered');
  }
  const hashed = await bcrypt.hash(password, 10);

  // Handle referral
  let referrerId = null;
  let referrerStudentId = '';
  if (referralCode && referralCode.trim()) {
    const code = referralCode.trim().toUpperCase();
    const refStudentId = code.startsWith('REF-') ? code.slice(4) : code;
    const referrer = await User.findOne({ studentId: refStudentId, role: 'student' });
    if (referrer) {
      referrerId = referrer._id;
      referrerStudentId = refStudentId;
    }
  }

  const user = await User.create({
    name,
    email,
    phone,
    password: hashed,
    plainPassword: password,
    studentId: genStudentId(),
    isEmailVerified: false,
    isWhatsappVerified: false,
    referredBy: referrerStudentId,
  });

  // Credit referrer with 50 coins
  if (referrerId) {
    await User.findByIdAndUpdate(referrerId, {
      $inc: { coins: 50, referralCount: 1 },
    });
  }

  // Generate WhatsApp Verification OTP (only for students)
  if (user.role === 'student') {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = await bcrypt.hash(code, 10);
    await OTP.deleteMany({ userId: user._id, purpose: 'whatsapp_verification' });
    await OTP.create({
      userId: user._id,
      email: user.email,
      codeHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 mins
      purpose: 'whatsapp_verification',
    });
    
    // Send OTP via WhatsApp
    await sendWhatsappOtp(user.phone, code);

    const tempToken = signToken({ _id: user._id, role: user.role });
    return res.status(201).json({ requiresVerification: true, tempToken, email: user.email, phone: user.phone });
  }

  // Non-students bypass verification
  user.isEmailVerified = true;
  user.isWhatsappVerified = true;
  await user.save();
  const token = signToken(user);
  await createSession(user._id, token, req);
  res.status(201).json({ ...safeUser(user), token });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  if (user.isActive === false) {
    res.status(403);
    throw new Error('Account has been deactivated. Please contact support.');
  }

  // ── Email Verification Check (only for students) ──
  if (user.role === 'student' && !user.isEmailVerified) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = await bcrypt.hash(code, 10);
    await OTP.deleteMany({ userId: user._id, purpose: 'email_verification' });
    await OTP.create({
      userId: user._id,
      email: user.email,
      codeHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      purpose: 'email_verification',
    });
    await sendVerificationEmail(user.email, code, user.name);
    const tempToken = signToken({ _id: user._id, role: user.role });
    return res.json({ requiresVerification: true, tempToken, email: user.email });
  }

  // ── 2FA path ──
  if (user.twoFactorEnabled && user.twoFactorMethod === 'email') {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = await bcrypt.hash(code, 10);
    await OTP.deleteMany({ userId: user._id, purpose: 'login' });
    await OTP.create({
      userId: user._id,
      email: user.email,
      codeHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      purpose: 'login',
    });
    await sendOtpEmail(user.email, code, user.name);
    // Short-lived temp token for the OTP verification step
    const tempToken = signToken({ _id: user._id, role: user.role });
    return res.json({ requires2FA: true, tempToken, email: user.email });
  }

  // ── Normal path ──
  const token = signToken(user);
  await createSession(user._id, token, req);
  const updatedUser = await updateUserStreakAndCoins(user);
  res.json({ ...safeUser(updatedUser), token });
});

/** POST /api/auth/verify-otp — complete login with OTP */
export const verifyOtp = asyncHandler(async (req, res) => {
  const { code } = req.body;
  const userId = req.user._id;
  const record = await OTP.findOne({ userId, purpose: 'login', used: false });
  if (!record) {
    res.status(400);
    throw new Error('No pending OTP. Please log in again.');
  }
  if (record.expiresAt < new Date()) {
    await OTP.findByIdAndDelete(record._id);
    res.status(400);
    throw new Error('OTP expired. Please log in again.');
  }
  if (!(await bcrypt.compare(String(code), record.codeHash))) {
    res.status(400);
    throw new Error('Invalid OTP');
  }
  await OTP.findByIdAndUpdate(record._id, { used: true });
  let user = await User.findById(userId);
  user = await updateUserStreakAndCoins(user);
  const token = signToken(user);
  await createSession(user._id, token, req);
  res.json({ ...safeUser(user), token });
});

/** POST /api/auth/verify-email — verify signup OTP */
export const verifyEmailSignup = asyncHandler(async (req, res) => {
  const { code } = req.body;
  const userId = req.user._id;
  const record = await OTP.findOne({ userId, purpose: { $in: ['email_verification', 'whatsapp_verification'] }, used: false });
  if (!record) {
    res.status(400);
    throw new Error('No pending verification code found.');
  }
  if (record.expiresAt < new Date()) {
    await OTP.findByIdAndDelete(record._id);
    res.status(400);
    throw new Error('Verification code expired. Please register/login again.');
  }
  if (!(await bcrypt.compare(String(code), record.codeHash))) {
    res.status(400);
    throw new Error('Invalid verification code');
  }
  await OTP.findByIdAndUpdate(record._id, { used: true });
  
  let user = await User.findByIdAndUpdate(userId, { 
    isEmailVerified: true, 
    isWhatsappVerified: true 
  }, { new: true });
  user = await updateUserStreakAndCoins(user);
  const token = signToken(user);
  await createSession(user._id, token, req);
  
  // Send welcome email (non-blocking)
  sendWelcomeEmail(user.email, user.name, user.studentId).catch(() => {});

  res.json({ ...safeUser(user), token });
});

/** POST /api/auth/forgot-password — send password reset OTP */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400);
    throw new Error('Email is required');
  }
  const user = await User.findOne({ email });
  if (!user) {
    res.status(404);
    throw new Error('No account found with this email');
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const codeHash = await bcrypt.hash(code, 10);
  await OTP.deleteMany({ userId: user._id, purpose: 'password_reset' });
  await OTP.create({
    userId: user._id,
    email: user.email,
    codeHash,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    purpose: 'password_reset',
  });
  await sendResetPasswordOtpEmail(user.email, code, user.name);

  res.json({ message: 'Password reset OTP sent to your email.' });
});

/** POST /api/auth/reset-password — reset password using OTP */
export const resetPassword = asyncHandler(async (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) {
    res.status(400);
    throw new Error('Email, OTP code and new password are required');
  }
  if (newPassword.length < 6) {
    res.status(400);
    throw new Error('Password must be at least 6 characters');
  }

  const user = await User.findOne({ email });
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const record = await OTP.findOne({ userId: user._id, purpose: 'password_reset', used: false });
  if (!record) {
    res.status(400);
    throw new Error('No pending password reset request found.');
  }
  if (record.expiresAt < new Date()) {
    await OTP.findByIdAndDelete(record._id);
    res.status(400);
    throw new Error('Password reset code expired. Please request again.');
  }
  if (!(await bcrypt.compare(String(code), record.codeHash))) {
    res.status(400);
    throw new Error('Invalid password reset code');
  }

  await OTP.findByIdAndUpdate(record._id, { used: true });

  const hashed = await bcrypt.hash(newPassword, 10);
  user.password = hashed;
  user.plainPassword = newPassword;
  await user.save();

  try {
    const { sendPasswordChangedEmail } = await import('../services/email.js');
    sendPasswordChangedEmail(user.email, user.name).catch(() => {});
  } catch (_) {}

  // Log in the user immediately
  const token = signToken(user);
  await createSession(user._id, token, req);

  res.json({ ...safeUser(user), token, message: 'Password updated successfully' });
});

export const me = asyncHandler(async (req, res) => {
  let user = await User.findById(req.user._id);
  if (user) {
    user = await updateUserStreakAndCoins(user);
  }
  const responseData = safeUser(user);
  
  if (user && user.role === 'student') {
    const timeoutSetting = await SystemSetting.findOne({ key: 'studentSessionTimeout' });
    responseData.studentSessionTimeout = timeoutSetting ? Number(timeoutSetting.value) : 10;
  }
  
  res.json(responseData);
});

export const redeemCoins = asyncHandler(async (req, res) => {
  const { cost, title } = req.body;
  if (!cost || cost < 250) {
    res.status(400);
    throw new Error('Minimum 250 Coins required to redeem');
  }
  const user = await User.findById(req.user._id);
  if (user.coins < 250) {
    res.status(400);
    throw new Error('You need at least 250 Coins to redeem');
  }
  if (user.coins < cost) {
    res.status(400);
    throw new Error('Insufficient coins');
  }
  user.coins -= cost;
  await user.save();

  await CoinRedemption.create({
    student: req.user._id,
    itemType: 'reward_catalog',
    itemName: title || 'Reward Catalog Item',
    coinsSpent: cost,
    discountAmount: cost,
  });

  res.json(safeUser(user));
});

export const getCoinRedemptions = asyncHandler(async (req, res) => {
  const redemptions = await CoinRedemption.find({ student: req.user._id }).sort({ createdAt: -1 });
  res.json(redemptions);
});

export const updateMe = asyncHandler(async (req, res) => {
  const { name, phone, avatar, password, currentPassword, grade, stream, board, exams, language, city } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) { res.status(404); throw new Error('User not found'); }
  if (name) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (avatar !== undefined) user.avatar = avatar;
  if (grade !== undefined) user.grade = grade;
  if (stream !== undefined) user.stream = stream;
  if (board !== undefined) user.board = board;
  if (exams !== undefined) user.exams = exams;
  if (language !== undefined) user.language = language;
  if (city !== undefined) user.city = city;
  let passwordChanged = false;
  if (password) {
    if (!currentPassword) { res.status(400); throw new Error('Current password is required'); }
    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) { res.status(400); throw new Error('Current password is incorrect'); }
    user.password = await bcrypt.hash(password, 10);
    passwordChanged = true;
  }
  await user.save();
  if (passwordChanged && user.email) {
    try {
      const { sendPasswordChangedEmail } = await import('../services/email.js');
      sendPasswordChangedEmail(user.email, user.name).catch(() => {});
    } catch (_) {}
  }
  res.json(safeUser(user));
});

/** GET /api/auth/sessions */
export const getSessions = asyncHandler(async (req, res) => {
  const sessions = await Session.find({ userId: req.user._id, isActive: true })
    .sort({ lastActive: -1 })
    .select('-tokenHash');
  res.json(sessions);
});

/** DELETE /api/auth/sessions/:id */
export const revokeSession = asyncHandler(async (req, res) => {
  const session = await Session.findOne({ _id: req.params.id, userId: req.user._id });
  if (!session) { res.status(404); throw new Error('Session not found'); }
  await Session.findByIdAndDelete(session._id);
  res.json({ message: 'Session revoked' });
});

/** DELETE /api/auth/sessions — revoke all except current */
export const revokeAllSessions = asyncHandler(async (req, res) => {
  const auth = req.headers.authorization;
  const currentHash = auth ? hashToken(auth.split(' ')[1]) : null;
  const query = { userId: req.user._id };
  if (currentHash) query.tokenHash = { $ne: currentHash };
  await Session.deleteMany(query);
  res.json({ message: 'All other sessions revoked' });
});

/** POST /api/auth/logout */
export const logout = asyncHandler(async (req, res) => {
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) {
    const hash = hashToken(auth.split(' ')[1]);
    await Session.deleteOne({ userId: req.user._id, tokenHash: hash });
  }
  res.json({ message: 'Logged out' });
});

/** PUT /api/auth/2fa — initiate enable or disable 2FA */
export const toggle2FA = asyncHandler(async (req, res) => {
  const { enable } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) { res.status(404); throw new Error('User not found'); }

  if (enable) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = await bcrypt.hash(code, 10);
    await OTP.deleteMany({ userId: user._id, purpose: '2fa_enable' });
    await OTP.create({
      userId: user._id,
      email: user.email,
      codeHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      purpose: '2fa_enable',
    });
    await sendOtpEmail(user.email, code, user.name);
    return res.json({ requiresVerification: true, message: 'OTP sent to your email.' });
  } else {
    user.twoFactorEnabled = false;
    user.twoFactorMethod = 'none';
    await user.save();
    return res.json({ ...safeUser(user), message: '2FA disabled' });
  }
});

/** POST /api/auth/2fa/verify — confirm OTP to enable 2FA */
export const verify2FAEnable = asyncHandler(async (req, res) => {
  const { code } = req.body;
  const userId = req.user._id;
  const record = await OTP.findOne({ userId, purpose: '2fa_enable', used: false });
  if (!record || record.expiresAt < new Date()) {
    res.status(400);
    throw new Error('OTP expired or not found. Please try again.');
  }
  if (!(await bcrypt.compare(String(code), record.codeHash))) {
    res.status(400);
    throw new Error('Invalid OTP');
  }
  await OTP.findByIdAndUpdate(record._id, { used: true });
  const user = await User.findById(userId);
  user.twoFactorEnabled = true;
  user.twoFactorMethod = 'email';
  await user.save();
  res.json({ ...safeUser(user), message: '2FA enabled successfully' });
});
/** POST /api/auth/streak-ping — mark today as active, update streak */
export const streakPing = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user || user.role !== 'student') {
    return res.json(safeUser(user));
  }

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Already marked today — return current data without modifying
  if (user.activeDays && user.activeDays.includes(todayStr)) {
    return res.json(safeUser(user));
  }

  // Add today
  if (!user.activeDays.includes(todayStr)) {
    user.activeDays.push(todayStr);
  }

  // Update streak (only if not frozen)
  if (!user.streakFrozen) {
    const lastLogin = user.lastLoginDate;
    if (!lastLogin) {
      user.streak = 1;
    } else {
      const lastStr = new Date(lastLogin).toISOString().split('T')[0];
      if (lastStr !== todayStr) {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        if (lastStr === yesterdayStr) {
          user.streak = (user.streak || 0) + 1;
        } else {
          user.streak = 1; // streak broken
        }
      }
    }
    if (user.streak > (user.longestStreak || 0)) {
      user.longestStreak = user.streak;
    }
  }

  user.lastLoginDate = now;
  await user.save();
  res.json(safeUser(user));
});

export const googleAuth = asyncHandler(async (req, res) => {
  const { credential, referralCode } = req.body;
  if (!credential) {
    res.status(400);
    throw new Error('Credential token is required');
  }

  // Verify ID Token with Google's API
  let payload;
  try {
    const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    if (!googleRes.ok) {
      throw new Error('Google token validation failed');
    }
    payload = await googleRes.json();
  } catch (err) {
    res.status(400);
    throw new Error('Invalid Google credential token');
  }

  // Verify client ID audience match
  const allowedClientId = '731893542358-lt0ardf07akolsj7k6v8ebr3idsg94sf.apps.googleusercontent.com';
  if (payload.aud !== allowedClientId && payload.azp !== allowedClientId) {
    res.status(400);
    throw new Error('Unauthorized Google Client ID');
  }

  const { email, name, picture, email_verified } = payload;
  if (!email) {
    res.status(400);
    throw new Error('Email not provided in Google profile');
  }

  // Find or create user
  let user = await User.findOne({ email });

  if (!user) {
    // Generate secure random password
    const rawPass = crypto.randomBytes(16).toString('hex');
    const hashed = await bcrypt.hash(rawPass, 10);

    // Handle referral
    let referrerId = null;
    let referrerStudentId = '';
    if (referralCode && referralCode.trim()) {
      const code = referralCode.trim().toUpperCase();
      const refStudentId = code.startsWith('REF-') ? code.slice(4) : code;
      const referrer = await User.findOne({ studentId: refStudentId, role: 'student' });
      if (referrer) {
        referrerId = referrer._id;
        referrerStudentId = refStudentId;
      }
    }

    user = await User.create({
      name: name || email.split('@')[0],
      email,
      password: hashed,
      plainPassword: 'Google OAuth Account',
      studentId: genStudentId(),
      avatar: picture || '',
      isEmailVerified: true, // Google email is pre-verified
      referredBy: referrerStudentId,
    });

    // Credit referrer with 50 coins
    if (referrerId) {
      await User.findByIdAndUpdate(referrerId, {
        $inc: { coins: 50, referralCount: 1 },
      });
    }
  } else {
    // Ensure email is marked verified since they successfully signed in via Google
    if (!user.isEmailVerified) {
      user.isEmailVerified = true;
      await user.save();
    }
  }

  // Login session & token generation
  const token = signToken(user);
  await createSession(user._id, token, req);
  const updatedUser = await updateUserStreakAndCoins(user);

  res.json({ ...safeUser(updatedUser), token });
});

export const deleteMe = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const { default: Enrollment } = await import('../models/Enrollment.js');
  const { default: TestSeriesEnrollment } = await import('../models/TestSeriesEnrollment.js');
  const { default: TestAttempt } = await import('../models/TestAttempt.js');
  const { default: SavedQuestion } = await import('../models/SavedQuestion.js');

  await User.findByIdAndDelete(userId);

  await Promise.all([
    Enrollment.deleteMany({ student: userId }),
    TestSeriesEnrollment.deleteMany({ student: userId }),
    Session.deleteMany({ userId }),
    OTP.deleteMany({ userId }),
    TestAttempt.deleteMany({ user: userId }),
    SavedQuestion.deleteMany({ user: userId }),
  ]);

  res.json({ ok: true, message: 'Your account has been deleted successfully' });
});

export const sendLoginOtp = asyncHandler(async (req, res) => {
  const { email, phone, channel } = req.body;
  if (!email && !phone) {
    res.status(400);
    throw new Error('Email or phone number is required');
  }

  let isPhone = false;
  let targetVal = '';
  if (phone) {
    isPhone = true;
    targetVal = phone.trim();
  } else {
    const trimmed = email.trim();
    if (/^\+?\d{9,15}$/.test(trimmed)) {
      isPhone = true;
      targetVal = trimmed;
    } else {
      targetVal = trimmed.toLowerCase();
    }
  }

  let user;
  let isNewUser = false;

  if (isPhone) {
    user = await User.findOne({ phone: targetVal });
    if (!user) {
      isNewUser = true;
      const name = 'Student-' + targetVal.slice(-4);
      const emailVal = `phone_${targetVal.replace('+', '')}@ace2examz.com`;
      const rawPass = crypto.randomBytes(16).toString('hex');
      const hashed = await bcrypt.hash(rawPass, 10);
      user = await User.create({
        name,
        email: emailVal,
        phone: targetVal,
        password: hashed,
        plainPassword: 'OTP Auto-Generated',
        studentId: genStudentId(),
        isEmailVerified: true,
        isWhatsappVerified: true,
      });
    }
  } else {
    user = await User.findOne({ email: targetVal });
    if (!user) {
      isNewUser = true;
      const name = targetVal.split('@')[0];
      const rawPass = crypto.randomBytes(16).toString('hex');
      const hashed = await bcrypt.hash(rawPass, 10);
      user = await User.create({
        name,
        email: targetVal,
        password: hashed,
        plainPassword: 'OTP Auto-Generated',
        studentId: genStudentId(),
        isEmailVerified: false,
        isWhatsappVerified: false,
      });
    }
  }

  if (user.isActive === false) {
    res.status(403);
    throw new Error('Account has been deactivated. Please contact support.');
  }

  // Generate a 6-digit OTP
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const codeHash = await bcrypt.hash(code, 10);

  // Store in OTP collection with purpose 'login_otp'
  await OTP.deleteMany({ userId: user._id, purpose: 'login_otp' });
  await OTP.create({
    userId: user._id,
    email: user.email,
    codeHash,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    purpose: 'login_otp',
  });

  // Dispatch OTP
  if (isPhone) {
    // Only WhatsApp integration, no SMS
    await sendWhatsappOtp(user.phone, code);
  } else {
    await sendOtpEmail(user.email, code, user.name);
  }

  // Return tempToken for verification
  const tempToken = signToken({ _id: user._id, role: user.role });
  res.json({
    success: true,
    tempToken,
    email: user.email,
    phone: user.phone,
    isNewUser,
    method: isPhone ? 'phone' : 'email',
  });
});

export const verifyLoginOtp = asyncHandler(async (req, res) => {
  const { code } = req.body;
  const userId = req.user._id;

  const record = await OTP.findOne({ userId, purpose: 'login_otp', used: false });
  if (!record) {
    res.status(400);
    throw new Error('No pending OTP found. Please try again.');
  }
  if (record.expiresAt < new Date()) {
    await OTP.findByIdAndDelete(record._id);
    res.status(400);
    throw new Error('OTP has expired. Please try again.');
  }
  if (!(await bcrypt.compare(String(code), record.codeHash))) {
    res.status(400);
    throw new Error('Invalid OTP');
  }

  await OTP.findByIdAndUpdate(record._id, { used: true });

  let user = await User.findById(userId);
  if (!user.isEmailVerified || !user.isWhatsappVerified) {
    user.isEmailVerified = true;
    user.isWhatsappVerified = true;
    await user.save();
    // Send welcome email (non-blocking)
    sendWelcomeEmail(user.email, user.name, user.studentId).catch(() => {});
  }

  user = await updateUserStreakAndCoins(user);
  const token = signToken(user);
  await createSession(user._id, token, req);

  res.json({ ...safeUser(user), token });
});






