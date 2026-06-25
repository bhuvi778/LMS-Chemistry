import mongoose from 'mongoose';

const coinRedemptionSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    itemType: { type: String, enum: ['course', 'test_series', 'reward_catalog', 'test_attempt'], required: true },
    itemId: { type: mongoose.Schema.Types.ObjectId, default: null }, // courseId or testSeriesId
    itemName: { type: String, required: true },
    coinsSpent: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 }, // in AED
  },
  { timestamps: true }
);

export default mongoose.model('CoinRedemption', coinRedemptionSchema);
