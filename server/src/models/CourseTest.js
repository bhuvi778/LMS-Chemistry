import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    options: [{ type: String }],
    correct: { type: Number, required: true }, // 0-based index of correct option
    explanation: { type: String, default: '' },
  },
  { _id: true }
);

const courseTestSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    durationMins: { type: Number, default: 30 },
    questions: [questionSchema],
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('CourseTest', courseTestSchema);
