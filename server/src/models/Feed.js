import mongoose from 'mongoose';

const feedSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true }, // Rich text content support
    image: { type: String, default: '' }, // Banner/attachment image URL
    link: { type: String, default: '' }, // Redirect URL (e.g. course link)
    isActive: { type: Boolean, default: true, index: true },
    likes: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        guestId: { type: String },
      }
    ],
    comments: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        userName: { type: String, required: true },
        guestId: { type: String },
        content: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      }
    ]
  },
  { timestamps: true }
);

export default mongoose.model('Feed', feedSchema);
