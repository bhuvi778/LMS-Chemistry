import mongoose from 'mongoose';

const mentorshipBookingSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sessionType: {
    type: String,
    enum: ['mentorship', 'doubt'],
    default: 'mentorship',
    index: true
  },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null },
  category: { type: String, default: '' },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  preferredDate: { type: Date, required: true },
  preferredTimeSlot: { type: String, required: true },
  status: {
    type: String,
    enum: ['Pending', 'Scheduled', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  mentorName: { type: String, default: '' },
  meetingLink: { type: String, default: '' },
  liveClass: { type: mongoose.Schema.Types.ObjectId, ref: 'LiveClass', default: null },
  sessionNotes: { type: String, default: '' }, // Feedback or notes from mentor
  studyPlan: { type: String, default: '' }, // study plan doc link or notes text
  rating: { type: Number, min: 1, max: 5 },
  studentFeedback: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('MentorshipBooking', mentorshipBookingSchema);
