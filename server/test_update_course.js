import mongoose from 'mongoose';
import Course from './src/models/Course.js';

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/chemprep_lms');
  console.log('Connected to MongoDB');
  
  // Find first course
  const course = await Course.findOne({});
  if (!course) {
    console.log('No course found');
    await mongoose.disconnect();
    return;
  }
  
  console.log('Before update:', {
    _id: course._id,
    title: course.title,
    isCombo: course.isCombo,
    allowUpgrade: course.allowUpgrade,
    allowExtendValidity: course.allowExtendValidity
  });
  
  // Perform update simulating what findByIdAndUpdate does
  const updated = await Course.findByIdAndUpdate(course._id, {
    isCombo: true,
    allowUpgrade: true,
    allowExtendValidity: true
  }, { new: true });
  
  console.log('After update:', {
    _id: updated._id,
    title: updated.title,
    isCombo: updated.isCombo,
    allowUpgrade: updated.allowUpgrade,
    allowExtendValidity: updated.allowExtendValidity
  });
  
  // Reset back
  await Course.findByIdAndUpdate(course._id, {
    isCombo: false,
    allowUpgrade: false,
    allowExtendValidity: false
  });
  
  await mongoose.disconnect();
}

run().catch(console.error);
