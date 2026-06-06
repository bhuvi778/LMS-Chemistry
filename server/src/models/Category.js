import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    subcategories: [{ type: String, trim: true }],
    icon: { type: String, default: '' },   // emoji e.g. "📘"
    color: { type: String, default: '' },  // tailwind gradient e.g. "from-blue-500 to-indigo-600"
  },
  { timestamps: true }
);

export default mongoose.model('Category', categorySchema);
