import mongoose from 'mongoose';

const watchHistorySchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    videoUrl: { type: String, required: true },
    videoTitle: { type: String, required: true },
    watchedDuration: { type: Number, default: 0 }, // in seconds
    lastWatchedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Unique compound index so that there is only one record per student, course, and video URL
watchHistorySchema.index({ student: 1, course: 1, videoUrl: 1 }, { unique: true });

export default mongoose.model('WatchHistory', watchHistorySchema);
