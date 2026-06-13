import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    planType: { type: String, enum: ['batch', 'pro', 'infinity'], default: 'batch' },
    pricePaid: { type: Number, required: true },
    paymentId: { type: String, default: '' },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'paid' },
    progress: { type: Number, default: 0 },
    validUntil: { type: Date, default: null },
    completedLessons: [{ type: mongoose.Schema.Types.ObjectId }],
    readAnnouncements: [{ type: mongoose.Schema.Types.ObjectId }],
  },
  { timestamps: true }
);

enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

enrollmentSchema.post('save', async function (doc, next) {
  if (doc.paymentStatus === 'paid') {
    try {
      const Course = mongoose.model('Course');
      const courseObj = await Course.findById(doc.course);
      if (courseObj && courseObj.isCombo) {
        if (courseObj.comboCourses?.length > 0) {
          const Enrollment = mongoose.model('Enrollment');
          for (const childCourseId of courseObj.comboCourses) {
            const existing = await Enrollment.findOne({
              student: doc.student,
              course: childCourseId,
            });
            if (!existing) {
              await Enrollment.create({
                student: doc.student,
                course: childCourseId,
                planType: doc.planType,
                pricePaid: 0,
                paymentId: doc.paymentId + '_COMBO',
                paymentStatus: 'paid',
                validUntil: doc.validUntil,
              });
              await Course.findByIdAndUpdate(childCourseId, {
                $inc: { studentsEnrolled: 1 },
              });
            } else if (existing.paymentStatus !== 'paid' || existing.planType !== doc.planType) {
              existing.paymentStatus = 'paid';
              existing.planType = doc.planType;
              existing.validUntil = doc.validUntil;
              await existing.save();
            }
          }
        }
        if (courseObj.comboTestSeries?.length > 0) {
          const TestSeriesEnrollment = mongoose.model('TestSeriesEnrollment');
          for (const tsId of courseObj.comboTestSeries) {
            const existingTS = await TestSeriesEnrollment.findOne({
              student: doc.student,
              testSeries: tsId,
            });
            if (!existingTS) {
              await TestSeriesEnrollment.create({
                student: doc.student,
                testSeries: tsId,
                pricePaid: 0,
                paymentId: doc.paymentId + '_COMBO',
                paymentStatus: 'paid',
                validUntil: doc.validUntil,
              });
            } else if (existingTS.paymentStatus !== 'paid') {
              existingTS.paymentStatus = 'paid';
              existingTS.validUntil = doc.validUntil;
              await existingTS.save();
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to auto-enroll combo child courses:', err);
    }
  }
  next();
});

export default mongoose.model('Enrollment', enrollmentSchema);
