import mongoose from 'mongoose';

const bankTransferRequestSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // What they're paying for
    itemType: { type: String, enum: ['course', 'test_series'], required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null },
    planType: { type: String, enum: ['batch', 'pro', 'infinity'], default: 'batch' },
    testSeries: { type: mongoose.Schema.Types.ObjectId, ref: 'TestSeries', default: null },

    // Amounts (AED)
    baseAmount: { type: Number, required: true },
    handlingFee: { type: Number, default: 0 }, // 45 AED or 0.7%
    totalAmount: { type: Number, required: true },

    // Bank transfer proof
    studentName: { type: String, default: '' },
    studentPhone: { type: String, default: '' },
    studentEmail: { type: String, default: '' },
    studentAddress: { type: String, default: '' },
    referenceNumber: { type: String, default: '' },
    screenshotUrl: { type: String, default: '' },
    notes: { type: String, default: '' },

    // Admin
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'rejected'],
      default: 'pending',
    },
    adminNote: { type: String, default: '' },
    confirmedAt: { type: Date, default: null },
    confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    // Coin redemption
    coinsRedeemed: { type: Number, default: 0 },
    coinDiscount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('BankTransferRequest', bankTransferRequestSchema);
