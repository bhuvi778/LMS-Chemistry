import mongoose from 'mongoose';

const dailyTargetSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    durationMins: { type: Number, default: 30 },
    questionsTarget: { type: Number, default: 0 },
    coinsReward: { type: Number, default: 0 },
    targetType: {
      type: String,
      enum: ['practice', 'test', 'custom_test', 'test_series', 'flashcards', 'ncert', 'resource', 'custom'],
      default: 'practice',
    },
    test: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', default: null },
    testSeries: { type: mongoose.Schema.Types.ObjectId, ref: 'TestSeries', default: null },
    linkUrl: { type: String, default: '' },
    buttonLabel: { type: String, default: 'Start Practice' },
    audience: {
      type: {
        type: String,
        enum: ['all', 'free', 'paid', 'plans'],
        default: 'all',
      },
      plans: {
        type: [String],
        enum: ['batch', 'pro', 'infinity'],
        default: [],
      },
    },
    categories: { type: [String], default: [] },
    loopEnabled: { type: Boolean, default: false },
    loopCycleDays: { type: Number, default: 15 },
    loopEndsAt: { type: Date, default: null },
    priority: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

dailyTargetSchema.index({ isActive: 1, startDate: 1, endDate: 1, loopEnabled: 1, priority: -1 });

export default mongoose.model('DailyTarget', dailyTargetSchema);
