import mongoose from 'mongoose';

// Keep for backward compatibility
export const EXAM_CATEGORIES = ['JEE', 'NEET', 'CBSE', 'IAT', 'NEST', 'NET', 'CSIR-NET', 'GATE', 'IIT-JAM', 'TIFR', 'OLYMPIAD', 'FOUNDATION'];

const lessonSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    videoUrl: { type: String, default: '' },
    duration: { type: String, default: '' },
    notes: { type: String, default: '' },
    isFree: { type: Boolean, default: false },
  },
  { _id: true }
);

const faqSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
  },
  { _id: true }
);

const syllabusItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
  },
  { _id: true }
);

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, index: true },
    // Legacy single category (backward compat)
    category: { type: String, default: '', index: true },
    // Multi-select categories
    categories: [{ type: String }],
    subCategories: [{ type: String }],
    subject: { type: String, default: 'Chemistry' },
    // level removed — not used anymore
    language: { type: String, default: 'Hindi + English' },
    thumbnail: { type: String, default: '' },
    shortDescription: { type: String, default: '' },
    description: { type: String, default: '' }, // HTML from rich-text editor
    price: { type: Number, required: true, default: 0 },
    mrp: { type: Number, default: 0 },
    plans: {
      batch: {
        enabled: { type: Boolean, default: true },
        price: { type: Number, default: 0 },
        mrp: { type: Number, default: 0 },
      },
      pro: {
        enabled: { type: Boolean, default: true },
        price: { type: Number, default: 0 },
        mrp: { type: Number, default: 0 },
      },
      infinity: {
        enabled: { type: Boolean, default: true },
        price: { type: Number, default: 0 },
        mrp: { type: Number, default: 0 },
        seatsLimit: { type: Number, default: 10 },
        seatsReserved: { type: Number, default: 0 },
      },
    },
    // Legacy duration field (backward compat)
    durationMonths: { type: Number, default: 0 },
    // New validity system
    validity: {
      type: {
        type: String,
        enum: ['duration', 'endDate', 'lifetime'],
        default: 'lifetime',
      },
      durationValue: { type: Number, default: 12 },
      durationUnit: { type: String, enum: ['days', 'months', 'years'], default: 'months' },
      endDate: { type: Date, default: null },
    },
    // Course delivery type
    courseType: {
      type: String,
      enum: ['recorded', 'live'],
      default: 'recorded',
    },
    totalLessons: { type: Number, default: 0 },
    instructor: { type: String, default: 'Ace2Examz Faculty' },
    educator: {
      photo: { type: String, default: '' },
      bio: { type: String, default: '' },
    },
    // Batch dates
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    highlights: [{ type: String }],
    syllabus: [syllabusItemSchema],
    faqs: [faqSchema],
    lessons: [lessonSchema],
    rating: { type: Number, default: 4.8 },
    studentsEnrolled: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    // Discount coupons (array – supports multiple coupons per course)
    discountCoupons: [
      {
        code: { type: String, default: '' },
        discountType: { type: String, enum: ['percent', 'amount'], default: 'percent' },
        discountValue: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true },
      },
    ],
    // Legacy single-coupon field kept for backward compatibility
    discountCoupon: {
      code: { type: String, default: '' },
      discountType: { type: String, enum: ['percent', 'amount'], default: 'percent' },
      discountValue: { type: Number, default: 0 },
      isActive: { type: Boolean, default: false },
    },
    // Additional settings
    isCombo: { type: Boolean, default: false },
    comboDescription: { type: String, default: '' },
    allowUpgrade: { type: Boolean, default: false },
    telegramJoinLink: { type: String, default: '' },
    // Upsell
    upsell: {
      enabled: { type: Boolean, default: false },
      title: { type: String, default: '' },
      courseId: { type: String, default: '' },
    },
    // SEO
    seo: {
      metaTitle: { type: String, default: '' },
      metaDescription: { type: String, default: '' },
    },
    // Test Portal integration
    standaloneTests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Test' }],
    testSeries: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TestSeries' }],
    // Demo / Orientation videos (public, visible without enrollment)
    demoVideoUrl: { type: String, default: '' },
    orientationVideoUrl: { type: String, default: '' },
    // Course notes / schedules / timetables (PDF or text)
    courseNotes: [
      {
        title: { type: String, default: '' },
        pdfUrl: { type: String, default: '' },
        content: { type: String, default: '' }, // HTML content
        isFree: { type: Boolean, default: false },
        order: { type: Number, default: 0 },
      },
    ],
    // Class timetable
    timetable: [
      {
        subject: { type: String, default: '' },
        timeFrom: { type: String, default: '' },
        timeTo: { type: String, default: '' },
        days: { type: String, default: 'Mon-Fri' },
        order: { type: Number, default: 0 },
      },
    ],
    // Student reviews
    reviews: [
      {
        student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        studentName: { type: String, default: '' },
        rating: { type: Number, min: 1, max: 5, required: true },
        comment: { type: String, default: '' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    announcements: [
      {
        title: { type: String, required: true },
        content: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

courseSchema.pre('save', function (next) {
  if (!this.slug && this.title) {
    this.slug =
      this.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') +
      '-' +
      Math.random().toString(36).slice(2, 7);
  }
  if (!this.plans || !this.plans.batch || !this.plans.batch.price) {
    const basePrice = this.price || 0;
    const baseMrp = this.mrp || 0;
    this.plans = {
      batch: { enabled: true, price: basePrice, mrp: baseMrp },
      pro: { enabled: true, price: Math.round(basePrice * 1.25), mrp: Math.round(baseMrp * 1.25) },
      infinity: { enabled: true, price: Math.round(basePrice * 1.5), mrp: Math.round(baseMrp * 1.5), seatsLimit: 15, seatsReserved: 0 }
    };
  }
  if (this.lessons) this.totalLessons = this.lessons.length;
  next();
});

export default mongoose.model('Course', courseSchema);
