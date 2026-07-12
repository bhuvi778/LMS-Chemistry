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
    isPaused: { type: Boolean, default: false },
    lastPauseStart: { type: Date, default: null },
    lastPauseDuration: { type: Number, default: null },
    lastPausePlannedResume: { type: Date, default: null },
    pauseHistory: [
      {
        pausedAt: { type: Date, required: true },
        resumedAt: { type: Date, required: true },
        durationDays: { type: Number, required: true },
      }
    ],
  },
  { timestamps: true }
);

enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

enrollmentSchema.post('save', async function (doc, next) {
  if (doc.paymentStatus === 'paid') {
    try {
      // Reward +75 coins on first course purchase
      const Enrollment = mongoose.model('Enrollment');
      const User = mongoose.model('User');
      const studentUser = await User.findById(doc.student);
      if (studentUser && !studentUser.firstPurchaseRewarded) {
        const paidCount = await Enrollment.countDocuments({
          student: doc.student,
          paymentStatus: 'paid',
          _id: { $ne: doc._id }
        });
        if (paidCount === 0) {
          studentUser.coins = (studentUser.coins || 0) + 75;
          studentUser.firstPurchaseRewarded = true;
          await studentUser.save();
        }
      }

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

      // Auto-enroll bundled items for Infinity plan
      if (doc.planType === 'infinity' && courseObj) {
        if (courseObj.plans?.infinity?.courses?.length > 0) {
          const Enrollment = mongoose.model('Enrollment');
          for (const childCourseId of courseObj.plans.infinity.courses) {
            const existing = await Enrollment.findOne({
              student: doc.student,
              course: childCourseId,
            });
            if (!existing) {
              await Enrollment.create({
                student: doc.student,
                course: childCourseId,
                planType: 'infinity',
                pricePaid: 0,
                paymentId: doc.paymentId + '_INFINITY',
                paymentStatus: 'paid',
                validUntil: doc.validUntil,
              });
              await Course.findByIdAndUpdate(childCourseId, {
                $inc: { studentsEnrolled: 1 },
              });
            } else if (existing.paymentStatus !== 'paid' || existing.planType !== 'infinity') {
              existing.paymentStatus = 'paid';
              existing.planType = 'infinity';
              existing.validUntil = doc.validUntil;
              await existing.save();
            }
          }
        }
        if (courseObj.plans?.infinity?.powerCourses?.length > 0) {
          const Enrollment = mongoose.model('Enrollment');
          for (const powerCourseId of courseObj.plans.infinity.powerCourses) {
            const existing = await Enrollment.findOne({
              student: doc.student,
              course: powerCourseId,
            });
            if (!existing) {
              await Enrollment.create({
                student: doc.student,
                course: powerCourseId,
                planType: 'infinity',
                pricePaid: 0,
                paymentId: doc.paymentId + '_INFINITY_POWER',
                paymentStatus: 'paid',
                validUntil: doc.validUntil,
              });
              await Course.findByIdAndUpdate(powerCourseId, {
                $inc: { studentsEnrolled: 1 },
              });
            } else if (existing.paymentStatus !== 'paid' || existing.planType !== 'infinity') {
              existing.paymentStatus = 'paid';
              existing.planType = 'infinity';
              existing.validUntil = doc.validUntil;
              await existing.save();
            }
          }
        }
        if (courseObj.plans?.infinity?.testSeries?.length > 0) {
          const TestSeriesEnrollment = mongoose.model('TestSeriesEnrollment');
          for (const tsId of courseObj.plans.infinity.testSeries) {
            const existingTS = await TestSeriesEnrollment.findOne({
              student: doc.student,
              testSeries: tsId,
            });
            if (!existingTS) {
              await TestSeriesEnrollment.create({
                student: doc.student,
                testSeries: tsId,
                pricePaid: 0,
                paymentId: doc.paymentId + '_INFINITY',
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
