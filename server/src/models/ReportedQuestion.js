import mongoose from 'mongoose';

const reportedQuestionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', default: null },
    questionId: { type: String, required: true },
    questionText: { type: String, default: '' },
    testTitle: { type: String, default: '' },
    reason: {
      type: String,
      enum: ['wrong_answer', 'wrong_question', 'typo', 'image_missing', 'other'],
      default: 'other',
    },
    description: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'fixed', 'dismissed'],
      default: 'pending',
    },
    adminNote: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('ReportedQuestion', reportedQuestionSchema);
