import mongoose from 'mongoose';

const testSeriesEnrollmentSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    testSeries: { type: mongoose.Schema.Types.ObjectId, ref: 'TestSeries', required: true },
    pricePaid: { type: Number, required: true },
    paymentId: { type: String, default: '' },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'paid' },
  },
  { timestamps: true }
);

testSeriesEnrollmentSchema.index({ student: 1, testSeries: 1 }, { unique: true });

export default mongoose.model('TestSeriesEnrollment', testSeriesEnrollmentSchema);
