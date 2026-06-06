import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // What they paid for
    itemType: { type: String, enum: ['course', 'test_series'], default: 'course' },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null },
    testSeries: { type: mongoose.Schema.Types.ObjectId, ref: 'TestSeries', default: null },

    // Razorpay IDs
    razorpayOrderId: { type: String, required: true },
    razorpayPaymentId: { type: String, default: '' },
    razorpaySignature: { type: String, default: '' },

    // Amount (in INR)
    amount: { type: Number, required: true },     // final amount charged
    originalAmount: { type: Number, default: 0 }, // before coupon
    couponCode: { type: String, default: '' },
    discountAmount: { type: Number, default: 0 },

    // Status
    status: {
      type: String,
      enum: ['created', 'paid', 'failed'],
      default: 'created',
    },

    // Invoice
    invoiceNumber: { type: String, default: '' },
    invoiceGeneratedAt: { type: Date, default: null },

    // Coin redemption
    coinsRedeemed: { type: Number, default: 0 },
    coinDiscount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('Payment', paymentSchema);
