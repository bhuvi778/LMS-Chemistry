import mongoose from 'mongoose';

const optionSchema = new mongoose.Schema(
  { text: { type: String, default: '' } },
  { _id: true }
);

const questionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    options: { type: [optionSchema], default: [] },
    correct: { type: Number }, // 0-based index (optional for MSQ/Numerical)
    correctOptions: { type: [Number], default: [] }, // for MSQ
    correctNumerical: { type: Number }, // for Numerical
    type: { type: String, enum: ['mcq', 'numerical', 'msq'], default: 'mcq' },
    videoSolutionUrl: { type: String, default: '' }, // question-level video solution
    explanation: { type: String, default: '' },
    marks: { type: Number, default: 4 },
    negativeMarks: { type: Number, default: -1 },
    partialMarking: { type: Boolean, default: true },
    partialMarkingMethod: {
      type: String,
      enum: ['correct_count', 'percentage_based'],
      default: 'correct_count',
    },
    image: { type: String, default: '' }, // optional question image URL
    section: { type: String, default: '' },
    chapter: { type: String, default: '' },
    topic: { type: String, default: '' },
  },
  { _id: true }
);

const testSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, sparse: true, index: true },
    description: { type: String, default: '' },
    instructions: { type: String, default: '' }, // HTML or plain text
    syllabus: { type: String, default: '' },
    subject: { type: String, default: 'Chemistry' },
    topics: [{ type: String }], // e.g. ['Organic', 'Inorganic']
    difficulty: {
      type: String,
      enum: ['basic', 'intermediate', 'advanced'],
      default: 'intermediate',
    },
    durationMins: { type: Number, default: 60 },
    totalMarks: { type: Number, default: 0 }, // computed or set manually
    passMarks: { type: Number, default: 0 },
    sections: [
      {
        name: { type: String, required: true },
        attemptAllowed: { type: Number, default: 0 }, // 0 = no limit
      }
    ],
    questions: [questionSchema],
    // Free/Paid access
    isFree: { type: Boolean, default: false },
    // Uploaded PDF (question paper / answer key)
    pdfUrl: { type: String, default: '' },
    pdfLabel: { type: String, default: 'Question Paper' },
    // Solution PDF
    solutionPdfUrl: { type: String, default: '' },
    // Video solution
    videoSolutionUrl: { type: String, default: '' },
    // Attempt & shuffle settings
    attemptsAllowed: { type: Number, default: 0 },   // 0 = unlimited
    maxQuestionsToAttempt: { type: Number, default: 0 }, // 0 = no limit (attempt all)
    shuffleQuestions: { type: Boolean, default: false },
    shuffleOptions: { type: Boolean, default: false },
    // Status
    isActive: { type: Boolean, default: true },
    isPublished: { type: Boolean, default: true },
    // Test type
    testType: {
      type: String,
      enum: ['test_series', 'previous_paper', 'quiz', 'live_test', 'infinite_practice'],
      default: 'test_series',
    },
    // Scheduling for live tests
    liveStartDate: { type: Date, default: null },
    liveEndDate: { type: Date, default: null },
    // Categories
    categories: [{ type: String }],
    subCategories: [{ type: String }],
    // Metadata
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // Optional: tag for exam type
    examTags: [{ type: String }], // e.g. ['JEE', 'NEET']
    order: { type: Number, default: 0 },
    // Display mode for previous_paper type: where to show it in frontend
    displayMode: {
      type: String,
      enum: ['standalone', 'series_only', 'both'],
      default: 'standalone',
    },
    isDailyTest: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Auto-compute totalMarks before save
testSchema.pre('save', function (next) {
  if (this.questions && this.questions.length > 0) {
    if (this.sections && this.sections.length > 0) {
      let total = 0;
      this.sections.forEach((sec) => {
        const secQuestions = this.questions.filter((q) => q.section === sec.name);
        const limit = sec.attemptAllowed > 0 ? sec.attemptAllowed : secQuestions.length;
        const sortedMarks = secQuestions.map((q) => q.marks || 4).sort((a, b) => b - a);
        for (let i = 0; i < Math.min(limit, sortedMarks.length); i++) {
          total += sortedMarks[i];
        }
      });
      // Add questions with no section
      const noSecQuestions = this.questions.filter((q) => !q.section);
      total += noSecQuestions.reduce((sum, q) => sum + (q.marks || 4), 0);
      this.totalMarks = total;
    } else {
      this.totalMarks = this.questions.reduce((sum, q) => sum + (q.marks || 4), 0);
    }
  }
  next();
});

export default mongoose.model('Test', testSchema);
