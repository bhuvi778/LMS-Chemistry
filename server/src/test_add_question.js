import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Test from './models/Test.js';

dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/chemprep_lms')
  .then(async () => {
    console.log('Connected to DB');
    // Find any test
    const test = await Test.findOne({});
    if (!test) {
      console.log('No test found in DB. Creating one first.');
      const newTest = await Test.create({
        title: 'Dummy Test for Debug',
        questions: [{
          question: 'What is water?',
          options: [{ text: 'H2O' }, { text: 'CO2' }, { text: 'O2' }, { text: 'N2' }],
          correct: 0,
          type: 'mcq'
        }]
      });
      console.log('Dummy test created:', newTest._id);
      process.exit(0);
    }

    console.log('Found test:', test.title, 'with questions count:', test.questions.length);

    // Try updating by adding a question using findByIdAndUpdate (the current method)
    const updatedQuestions = [
      ...test.questions.map(q => q.toObject()),
      {
        question: 'New debug question?',
        options: [{ text: 'Opt 1' }, { text: 'Opt 2' }, { text: 'Opt 3' }, { text: 'Opt 4' }],
        correct: 1,
        type: 'mcq'
      }
    ];

    try {
      console.log('Attempting update with findByIdAndUpdate...');
      const res = await Test.findByIdAndUpdate(test._id, { questions: updatedQuestions }, {
        new: true,
        runValidators: true
      });
      console.log('Update successful! Questions count is now:', res.questions.length);
      console.log('First question id:', res.questions[0]._id);
      console.log('Last question id:', res.questions[res.questions.length - 1]._id);
    } catch (err) {
      console.error('Update failed with error:', err);
    }

    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
