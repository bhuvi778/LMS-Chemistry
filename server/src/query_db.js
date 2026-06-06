import mongoose from 'mongoose';
import dotenv from 'dotenv';
import TestSeries from './models/TestSeries.js';
import Test from './models/Test.js';

dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/chemprep_lms')
  .then(async () => {
    console.log('DB connected');
    const series = await TestSeries.find({}).populate('tests.test');
    console.log('Total test series:', series.length);
    series.forEach(s => {
      console.log('Series Title:', s.title);
      console.log('Series Type:', s.seriesType);
      console.log('Categories:', s.categories);
      console.log('Subcategories:', s.subCategories);
      console.log('Tests count:', s.tests.length);
      s.tests.forEach((t, i) => {
        console.log(`  Test ${i+1}: title=${t.test?.title}, mainType=${t.mainType}, subType=${t.subType}, customTags=${t.customTags}`);
      });
    });
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
