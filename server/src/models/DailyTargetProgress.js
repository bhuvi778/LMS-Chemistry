import mongoose from 'mongoose';

const dailyTargetProgressSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    target: { type: mongoose.Schema.Types.ObjectId, ref: 'DailyTarget', required: true },
    cycleNumber: { type: Number, default: 1 },
    cycleStartDate: { type: Date, default: null },
    isCompleted: { type: Boolean, default: true },
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

dailyTargetProgressSchema.index({ student: 1, target: 1, cycleNumber: 1 }, { unique: true });

export default mongoose.model('DailyTargetProgress', dailyTargetProgressSchema);
