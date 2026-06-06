import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    studentId: { type: String, unique: true, sparse: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    password: { type: String, required: true },
    // Stored for admin visibility only (admin portal). Never exposed to students.
    plainPassword: { type: String, default: '' },
    role: { type: String, enum: ['student', 'admin'], default: 'student' },
    avatar: { type: String, default: '' },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorMethod: { type: String, enum: ['email', 'none'], default: 'none' },
    isEmailVerified: { type: Boolean, default: false },
    passwordSetAt: { type: Date, default: Date.now },
    passwordSetByAdmin: { type: Boolean, default: false },
    // Max 5 concurrent active sessions
    maxSessions: { type: Number, default: 5 },
    // Firebase FCM push token(s)
    fcmTokens: { type: [String], default: [] },
    // Academic details
    grade: { type: String, default: '' },
    stream: { type: String, default: '' },
    board: { type: String, default: '' },
    exams: { type: String, default: '' },
    language: { type: String, default: '' },
    city: { type: String, default: '' },
    // Streak & Wallet
    coins: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastLoginDate: { type: Date },
    activeDays: { type: [String], default: [] },
    streakFrozen: { type: Boolean, default: false },
    // Referral
    referredBy: { type: String, default: '' },
    referralCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
