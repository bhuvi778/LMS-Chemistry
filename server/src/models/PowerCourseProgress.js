import mongoose from 'mongoose';

const powerCourseProgressSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  completedDays: [{ type: Number }], // Array of day numbers completed: [1, 2, 3...]
  dayProgress: [
    {
      dayNumber: { type: Number, required: true },
      tasksCompleted: [{ type: String }], // 'video', 'notes', 'quiz', 'assignment'
      quizScore: { type: Number, default: 0 },
      quizQuestionsScore: { type: String, default: '' }, // e.g., "10/10"
      assignmentSubmission: { type: String, default: '' },
      submittedAt: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

powerCourseProgressSchema.index({ student: 1, course: 1 }, { unique: true });

export default mongoose.model('PowerCourseProgress', powerCourseProgressSchema);
