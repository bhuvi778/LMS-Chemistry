import mongoose from 'mongoose';

const dailyTargetProgressSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    target: { type: mongoose.Schema.Types.ObjectId, ref: 'DailyTarget', required: true },
    cycleNumber: { type: Number, default: 1 },
    cycleStartDate: { type: Date, default: null },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed'],
      default: 'not_started',
    },
    isCompleted: { type: Boolean, default: false },
    totalQuestions: { type: Number, default: 0 },
    answeredCount: { type: Number, default: 0 },
    correctCount: { type: Number, default: 0 },
    wrongCount: { type: Number, default: 0 },
    progressPercent: { type: Number, default: 0 },
    lastQuestionIndex: { type: Number, default: 0 },
    draftAnswers: { type: mongoose.Schema.Types.Mixed, default: {} },
    draftFeedback: { type: mongoose.Schema.Types.Mixed, default: {} },
    startedAt: { type: Date, default: null },
    lastActivityAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

dailyTargetProgressSchema.index({ student: 1, target: 1, cycleNumber: 1 }, { unique: true });

export default mongoose.model('DailyTargetProgress', dailyTargetProgressSchema);
