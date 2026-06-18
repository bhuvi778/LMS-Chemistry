import mongoose from 'mongoose';
import crypto from 'crypto';

const liveClassSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null },
    courseName: { type: String, default: '' },
    instructor: { type: String, default: 'Ace2Examz Faculty' },
    // External provider link (Zoom/Meet/YouTube) — optional
    meetLink: { type: String, default: '' },
    meetingUrl: { type: String, default: '' },
    // Platform type
    platform: {
      type: String,
      enum: ['internal', 'zoom', 'meet', 'youtube', 'agora_call', 'agora_stream', 'agora_interactive', 'agora_broadcast'],
      default: 'internal',
    },
    // Self-hosted WebRTC room / Agora room
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
  // Sync new platform fields with older useInternalRoom/meetLink fields
  if (this.platform) {
    if (['zoom', 'meet', 'youtube'].includes(this.platform)) {
      this.useInternalRoom = false;
      this.meetLink = this.meetingUrl || this.meetLink;
      this.meetingUrl = this.meetLink;
    } else {
      this.useInternalRoom = true;
      this.meetLink = '';
      this.meetingUrl = '';
    }
  } else {
    // If platform is not specified, derive it from older fields
    if (this.useInternalRoom) {
      this.platform = 'internal';
    } else {
      this.platform = this.meetLink?.includes('zoom.us') ? 'zoom' : 
                      this.meetLink?.includes('youtube.com') || this.meetLink?.includes('youtu.be') ? 'youtube' : 
                      'meet';
      this.meetingUrl = this.meetLink;
    }
  }

  if (this.useInternalRoom && !this.roomId) {
    this.roomId = crypto.randomBytes(6).toString('hex');
  }
  next();
});

export default mongoose.model('LiveClass', liveClassSchema);

