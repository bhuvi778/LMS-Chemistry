import mongoose from 'mongoose';
import crypto from 'crypto';

const liveClassSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null },
    courseName: { type: String, default: '' },
    instructor: { type: String, default: 'Ace2Examz Faculty' },
    // External provider link (Zoom/Meet) — optional
    meetLink: { type: String, default: '' },
    // Self-hosted WebRTC room
    useInternalRoom: { type: Boolean, default: true },
    roomId: { type: String, unique: true, sparse: true, index: true },
    // Optional 6-char passcode required to join the internal room
    roomPasscode: { type: String, default: '' },
    scheduledAt: { type: Date, required: true },
    durationMins: { type: Number, default: 60 },
    isActive: { type: Boolean, default: true },
    // 'scheduled' | 'live' | 'ended'
    status: { type: String, enum: ['scheduled', 'live', 'ended'], default: 'scheduled' },
    startedAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

liveClassSchema.pre('save', function (next) {
  if (this.useInternalRoom && !this.roomId) {
    this.roomId = crypto.randomBytes(6).toString('hex');
  }
  next();
});

export default mongoose.model('LiveClass', liveClassSchema);

