import mongoose from 'mongoose';

const doubtSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null },
    subject: { type: String, default: '' },
    question: { type: String, required: true, trim: true },
    questionImage: { type: String, default: '' }, // optional image URL
    answer: { type: String, default: '' },
    answeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    answeredAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ['open', 'answered', 'closed'],
      default: 'open',
      index: true,
    },
    priority: { type: String, enum: ['low', 'normal', 'high'], default: 'normal' },
  },
  { timestamps: true }
);

// TTL: auto-delete answered doubts after 180 days
doubtSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 180, partialFilterExpression: { status: 'answered' } });

export default mongoose.model('Doubt', doubtSchema);
