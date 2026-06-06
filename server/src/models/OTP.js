import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    email: { type: String, required: true, lowercase: true },
    codeHash: { type: String, required: true }, // bcrypt hash of 6-digit code
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false },
    purpose: { type: String, enum: ['login', '2fa_enable', 'email_verification', 'password_reset'], default: 'login' },
  },
  { timestamps: true }
);

// Auto-delete expired OTPs
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('OTP', otpSchema);
