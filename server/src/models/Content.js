import mongoose from 'mongoose';

/**
 * Generic Content model for landing-page sections:
 *  - banner      (hero slider)
 *  - highlight   (feature cards)
 *  - topper      (result cards)
 *  - review      (student testimonials)
 *  - video       (related videos / youtube embeds)
 */
const contentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['banner', 'highlight', 'topper', 'review', 'video'],
      required: true,
      index: true,
    },
    title: { type: String, default: '' },
    subtitle: { type: String, default: '' },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    link: { type: String, default: '' },
    // Topper-specific
    exam: { type: String, default: '' },
    rank: { type: String, default: '' },
    year: { type: String, default: '' },
    // Review-specific
    author: { type: String, default: '' },
    rating: { type: Number, default: 5 },
    // Video-specific
    videoUrl: { type: String, default: '' },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Content', contentSchema);
