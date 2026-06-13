import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './src/models/User.js';

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/chemprep_lms');
  console.log('Connected to MongoDB');
  const adminPass = await bcrypt.hash('Admin@123', 10);
  const res = await User.updateOne(
    { email: 'admin@ace2examz.com' },
    { $set: { password: adminPass } }
  );
  console.log('Update result:', res);
  await mongoose.disconnect();
}

run().catch(console.error);
