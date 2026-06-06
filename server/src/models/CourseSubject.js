import mongoose from 'mongoose';

// ─── Reusable content item ────────────────────────────────────────────────────
const contentItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    videoUrl: { type: String, default: '' },
    fileUrl: { type: String, default: '' },
    duration: { type: String, default: '' },
    isFree: { type: Boolean, default: false }, // visible without enrollment
    order: { type: Number, default: 0 },
  },
  { _id: true }
);

// ─── Test / DPP metadata item ─────────────────────────────────────────────────
const testItemSchema = new mongoose.Schema(
  {
    testId: { type: mongoose.Schema.Types.ObjectId, ref: 'CourseTest', index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    durationMins: { type: Number, default: 30 },
    questionCount: { type: Number, default: 0 },
    isFree: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { _id: true }
);

// ─── Chapter ──────────────────────────────────────────────────────────────────
const chapterSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
    videoClasses: [contentItemSchema],   // Recorded video lectures
    classNotes: [contentItemSchema],     // PDF notes / handwritten notes
    tests: [testItemSchema],             // MCQ chapter tests
    dpps: [testItemSchema],              // Daily Practice Problem sets
    dppPdfs: [contentItemSchema],        // DPP problem PDFs
    dppVideos: [contentItemSchema],      // DPP solution videos
    studyMaterials: [contentItemSchema], // Additional resources
  },
  { _id: true }
);

// ─── Subject ──────────────────────────────────────────────────────────────────
const courseSubjectSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
    chapters: [chapterSchema],
  },
  { timestamps: true }
);

export default mongoose.model('CourseSubject', courseSubjectSchema);
