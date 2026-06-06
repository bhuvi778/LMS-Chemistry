import mongoose from 'mongoose';

const popupSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    image: { type: String, default: '' }, // Banner image URL
    link: { type: String, default: '' }, // Landing page link
    buttonText: { type: String, default: 'View Offer' },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export default mongoose.model('Popup', popupSchema);
