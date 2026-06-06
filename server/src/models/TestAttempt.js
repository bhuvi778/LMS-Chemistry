import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId },
    selected: { type: mongoose.Schema.Types.Mixed, default: -1 }, // -1 = not attempted, or number, or array of numbers
    isCorrect: { type: Boolean, default: false },
    marksAwarded: { type: Number, default: 0 },
  },
  { _id: false }
);

const testAttemptSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    test: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true, index: true },
    // Optional: which course/series this attempt came from
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null },
    testSeries: { type: mongoose.Schema.Types.ObjectId, ref: 'TestSeries', default: null },
    answers: [answerSchema],
    totalMarks: { type: Number, default: 0 },
    scored: { type: Number, default: 0 },
    correct: { type: Number, default: 0 },
    wrong: { type: Number, default: 0 },
    unattempted: { type: Number, default: 0 },
    timeTakenSecs: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    rank: { type: Number, default: null }, // computed asynchronously
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Compound index: one attempt per user per test per context
testAttemptSchema.index({ user: 1, test: 1, course: 1 });

export default mongoose.model('TestAttempt', testAttemptSchema);
