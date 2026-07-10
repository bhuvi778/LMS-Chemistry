import mongoose from 'mongoose';

const ebookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    subject: { type: String, default: '' },
    grade: { type: mongoose.Schema.Types.Mixed, default: '' },   // e.g. "Class 11", "JEE", "NEET" or array of category names
    gradeType: { type: String, default: '' }, // Custom typed grade text
    contentType: { type: String, enum: ['ebook', 'enote', 'emagazine'], default: 'ebook' },
    subCategory: { type: String, default: '' }, // For E-Notes: 'Short Notes', 'Handwritten Notes', 'VVIQ', 'Mindmaps', 'Formula Charts', 'PYQs'
    chapter: { type: String, default: '' },     // For E-Notes chapterwise sorting
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

ebookSchema.index({ isActive: 1, order: 1, createdAt: -1 });

export default mongoose.model('Ebook', ebookSchema);
