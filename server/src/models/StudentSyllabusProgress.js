import mongoose from 'mongoose';

const studentSyllabusProgressSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subTopicId: { type: String, required: true },
  completedItems: {
    type: [String], // Array containing 'video', 'notes', 'dpp', 'dppVideo', 'mockTest'
    default: []
  }
}, { timestamps: true });

studentSyllabusProgressSchema.index({ student: 1, subTopicId: 1 }, { unique: true });

export default mongoose.model('StudentSyllabusProgress', studentSyllabusProgressSchema);
