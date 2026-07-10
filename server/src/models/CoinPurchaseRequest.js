import mongoose from 'mongoose';

const coinPurchaseRequestSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    coinsRequested: { type: Number, required: true },
    amountPaid: { type: Number, required: true },
    studentName: { type: String, required: true },
    studentPhone: { type: String, required: true },
    studentEmail: { type: String, required: true },
    referenceNumber: { type: String, default: '' },
    screenshotUrl: { type: String, default: '' },
    notes: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    adminNote: { type: String, default: '' },
    processedAt: { type: Date, default: null },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

export default mongoose.model('CoinPurchaseRequest', coinPurchaseRequestSchema);
