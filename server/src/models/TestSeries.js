import mongoose from 'mongoose';

const testSeriesSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, sparse: true, index: true },
    description: { type: String, default: '' },
    subject: { type: String, default: 'Chemistry' },
    examTags: [{ type: String }],
    thumbnail: { type: String, default: '' },

    // Series type
    seriesType: {
      type: String,
      enum: ['test_series', 'previous_paper'],
      default: 'test_series',
    },

    // Categories (linked to Category model names)
    categories: [{ type: String }],
    subCategories: [{ type: String }],

    // Tests included in this series (ordered)
    tests: [
      {
        test: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
        order: { type: Number, default: 0 },
        mainType: {
          type: String,
          enum: ['mock', 'previous_year'],
          default: 'mock',
        },
        subType: {
          type: String,
          enum: ['full_test', 'sectional', 'chapter', 'other'],
          default: 'full_test',
        },
        customTags: [{ type: String }],
      },
    ],

    // Free/Paid
    isFree: { type: Boolean, default: false },
    price: { type: Number, default: 0 },
    mrp: { type: Number, default: 0 },

    // Discount coupons (array – supports multiple coupons per series)
    discountCoupons: [
      {
        code: { type: String, default: '' },
        discountType: { type: String, enum: ['percent', 'amount'], default: 'percent' },
        discountValue: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true },
        maxUses: { type: Number, default: 0 }, // 0 = unlimited
        maxUsesPerUser: { type: Number, default: 0 }, // 0 = unlimited
      },
    ],
    // Legacy single-coupon field kept for backward compatibility
    discountCoupon: {
      code: { type: String, default: '' },
      discountType: { type: String, enum: ['percent', 'amount'], default: 'percent' },
      discountValue: { type: Number, default: 0 },
      isActive: { type: Boolean, default: false },
    },

    // Validity
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

    // SEO
    seo: {
      metaTitle: { type: String, default: '' },
      metaDescription: { type: String, default: '' },
    },

    // Syllabus
    syllabusText: { type: String, default: '' },
    syllabusFileUrl: { type: String, default: '' },

    // Status
    isActive: { type: Boolean, default: true },
    isPublished: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model('TestSeries', testSeriesSchema);
