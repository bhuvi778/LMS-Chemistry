import mongoose from 'mongoose';

const feedSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true }, // Rich text content support
    image: { type: String, default: '' }, // Banner/attachment image URL
    link: { type: String, default: '' }, // Redirect URL (e.g. course link)
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export default mongoose.model('Feed', feedSchema);
