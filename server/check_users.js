import mongoose from 'mongoose';
import User from './src/models/User.js';

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/chemprep_lms');
  console.log('Connected to MongoDB');
  const users = await User.find({}, 'name email role');
  console.log('Users in DB:', users);
  await mongoose.disconnect();
}

run().catch(console.error);
