import mongoose from 'mongoose';

const ebookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    subject: { type: String, default: '' },
    grade: { type: String, default: '' },   // e.g. "Class 11", "JEE", "NEET"
    coverImage: { type: String, default: '' },
    fileUrl: { type: String, default: '' },
    fileSize: { type: String, default: '' }, // e.g. "2.3 MB"
    pages: { type: Number, default: 0 },
    // Access control
    isFree: { type: Boolean, default: false },
    // Optional: restrict to specific course enrollments
    courses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    downloads: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('Ebook', ebookSchema);
