import mongoose from 'mongoose';

const examCountdownSchema = new mongoose.Schema(
  {
    examName: {
      type: String,
      required: true,
      trim: true
    },
    examDate: {
      type: Date,
      required: true
    },
    description: {
      type: String,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    color: {
      type: String,
      default: 'cyan',
      enum: ['cyan', 'blue', 'red', 'green', 'purple', 'orange', 'pink']
    },
    icon: {
      type: String,
      default: 'fa-graduation-cap'
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('ExamCountdown', examCountdownSchema);
