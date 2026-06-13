import mongoose from 'mongoose';
import Course from './src/models/Course.js';

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/chemprep_lms');
  console.log('Connected to MongoDB');
  const courses = await Course.find({});
  console.log('Courses in DB:', JSON.stringify(courses, null, 2));
  await mongoose.disconnect();
}

run().catch(console.error);
