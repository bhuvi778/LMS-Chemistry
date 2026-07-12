import mongoose from 'mongoose';

const mentorshipSettingSchema = new mongoose.Schema(
  {
    targetType: {
      type: String,
      enum: ['category', 'course', 'global'],
      required: true,
    },
    targetId: {
      type: String,
      required: true,
      index: true,
    }, // Course MongoDB ID, Category Name, or 'global'
    enabled: {
      type: Boolean,
      default: true,
    },
    availableDates: {
      type: [String],
      default: [],
    }, // Array of date strings: ['2026-06-25', '2026-06-26']
    availableSlots: {
      type: [String],
      default: [],
    }, // Array of slot strings: ['10:00 AM - 11:00 AM', '02:00 PM - 03:00 PM']
    mentorshipMonthlyLimit: {
      type: Number,
      default: 2,
      min: 0,
    },
    doubtMonthlyLimit: {
      type: Number,
      default: 4,
      min: 0,
    },
    doubtWeeklyLimit: {
      type: Number,
      default: 1,
      min: 0,
    },
  },
  { timestamps: true }
);

// Enforce unique settings per targetType and targetId combination
mentorshipSettingSchema.index({ targetType: 1, targetId: 1 }, { unique: true });

export default mongoose.model('MentorshipSetting', mentorshipSettingSchema);
