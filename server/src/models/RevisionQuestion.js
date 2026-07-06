import mongoose from 'mongoose';

const revisionQuestionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', default: null },
    questionId: { type: String, required: true }, // question._id (string)
    questionText: { type: String, default: '' },
    options: [{ text: String }],
    correct: { type: Number, default: 0 },
    correctOptions: [{ type: Number }], // MSQ support
    correctNumerical: { type: Number }, // Numerical support
    type: { type: String, default: 'mcq' }, // MCQ, MSQ, Numerical
    explanation: { type: String, default: '' },
    image: { type: String, default: '' },
    testTitle: { type: String, default: '' },
  },
  { timestamps: true }
);

// Prevent duplicate entries for same user+question
revisionQuestionSchema.index({ user: 1, questionId: 1 }, { unique: true });

export default mongoose.model('RevisionQuestion', revisionQuestionSchema);
