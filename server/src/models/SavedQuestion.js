import mongoose from 'mongoose';

const savedQuestionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', default: null },
    questionId: { type: String, required: true }, // question._id (string)
    questionText: { type: String, default: '' },
    options: [{ text: String }],
    correct: { type: Number, default: 0 },
    explanation: { type: String, default: '' },
    image: { type: String, default: '' },
    testTitle: { type: String, default: '' },
  },
  { timestamps: true }
);

// Prevent duplicate saves for same user+question
savedQuestionSchema.index({ user: 1, questionId: 1 }, { unique: true });

export default mongoose.model('SavedQuestion', savedQuestionSchema);
