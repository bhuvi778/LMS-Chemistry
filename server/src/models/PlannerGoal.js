import mongoose from 'mongoose';

const plannerGoalSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  title: { type: String, required: true },
  associatedSubTopic: { type: String, default: '' },
  associatedActivity: { type: String, default: '' },
  isCompleted: { type: Boolean, default: false },
  completedAt: { type: Date },
  coinAwarded: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('PlannerGoal', plannerGoalSchema);
