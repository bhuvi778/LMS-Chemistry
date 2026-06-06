import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, index: true }, // SHA-256 hash of the JWT
    deviceInfo: { type: String, default: 'Unknown Device' },
    ip: { type: String, default: '' },
    lastActive: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Auto-expire inactive sessions after 32 days (slightly more than 30d JWT)
sessionSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 32 });

export default mongoose.model('Session', sessionSchema);
