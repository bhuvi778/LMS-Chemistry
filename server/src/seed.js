import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Course from './models/Course.js';
import Content from './models/Content.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/chemprep_lms';

const courses = [
  {
    title: 'JEE Chemistry Complete Course 2026',
    category: 'JEE',
    level: 'Advanced',
    thumbnail:
      'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=900&auto=format&fit=crop&q=80',
    shortDescription: 'Complete Physical + Organic + Inorganic for JEE Main & Advanced.',
    description:
      'Master every chapter of Chemistry for JEE Main and Advanced with 600+ recorded lectures, DPPs, and full-length mock tests. Taught by top IIT faculty.',
    price: 7999,
    mrp: 14999,
    durationMonths: 12,
    instructor: 'Dr. Rajeev Sharma (IIT Bombay)',
    highlights: [
      '600+ HD Lectures',
      'Weekly Mock Tests',
      'Printed + PDF Notes',
      '24x7 Doubt Support',
    ],
    syllabus: ['Physical Chemistry', 'Organic Chemistry', 'Inorganic Chemistry', 'PYQs Analysis'],
    isFeatured: true,
    studentsEnrolled: 1240,
  },
  {
    title: 'NEET Chemistry Champion Batch',
    category: 'NEET',
    level: 'Intermediate',
    thumbnail:
      'https://images.unsplash.com/photo-1554475901-4538ddfbccc2?w=900&auto=format&fit=crop&q=80',
    shortDescription: 'NCERT-centric NEET Chemistry with 500+ lectures & test series.',
    description:
      'Dedicated NEET Chemistry batch focused on NCERT, with chapterwise PYQs, NCERT line-by-line, and AIIMS-level problem solving.',
    price: 5999,
    mrp: 11999,
    durationMonths: 12,
    instructor: 'Dr. Anjali Verma',
    highlights: ['NCERT line-by-line', 'AIIMS PYQs', '40+ Full Tests', 'Hinglish Lectures'],
    syllabus: ['Class 11 Chemistry', 'Class 12 Chemistry', 'NCERT MCQs', 'Revision Modules'],
    isFeatured: true,
    studentsEnrolled: 2310,
  },
  {
    title: 'CSIR-NET Chemical Sciences',
    category: 'CSIR-NET',
    level: 'Advanced',
    thumbnail:
      'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=900&auto=format&fit=crop&q=80',
    shortDescription: 'Complete CSIR-NET Chemical Sciences Part B + C preparation.',
    description:
      'In-depth CSIR-NET coaching: Physical, Organic, Inorganic, Interdisciplinary with PYQs since 2011 and unit tests.',
    price: 8999,
    mrp: 15999,
    durationMonths: 8,
    instructor: 'Dr. S. Mukherjee (IIT Kanpur)',
    highlights: ['PYQ since 2011', 'Unit Tests', 'Live Doubt Sessions', 'Updated Syllabus'],
    syllabus: ['Physical', 'Organic', 'Inorganic', 'Interdisciplinary'],
    isFeatured: true,
    studentsEnrolled: 540,
  },
  {
    title: 'GATE Chemistry (CY) 2026',
    category: 'GATE',
    level: 'Advanced',
    thumbnail:
      'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=900&auto=format&fit=crop&q=80',
    shortDescription: 'GATE Chemistry full syllabus with problem-solving focus.',
    description:
      'Complete GATE Chemistry (CY paper) with concept lectures, formula sheets, and 50+ mock tests.',
    price: 6999,
    mrp: 12999,
    durationMonths: 8,
    instructor: 'Prof. N. Iyer (IISc)',
    highlights: ['50+ Mocks', 'Formula Booklet', 'Previous Year Analysis'],
    syllabus: ['Physical', 'Organic', 'Inorganic', 'Analytical'],
    studentsEnrolled: 310,
  },
  {
    title: 'IIT-JAM Chemistry Masterclass',
    category: 'IIT-JAM',
    level: 'Intermediate',
    thumbnail:
      'https://images.unsplash.com/photo-1606613811471-0b3e7c4d2f9e?w=900&auto=format&fit=crop&q=80',
    shortDescription: 'IIT-JAM Chemistry with concept + PYQ + mock tests.',
    description: 'Focused IIT-JAM Chemistry preparation from basics to advanced.',
    price: 4999,
    mrp: 8999,
    durationMonths: 6,
    instructor: 'Dr. Kavita Singh',
    highlights: ['PYQs', 'Chapter Tests', 'Doubt Forum'],
    syllabus: ['Physical', 'Organic', 'Inorganic'],
    studentsEnrolled: 190,
  },
  {
    title: 'IAT & NEST Chemistry Crash Course',
    category: 'IAT',
    level: 'Intermediate',
    thumbnail:
      'https://images.unsplash.com/photo-1614935151651-0bea6508db6b?w=900&auto=format&fit=crop&q=80',
    shortDescription: 'Crash course for IISER IAT & NISER NEST aspirants.',
    description: 'Combined IAT + NEST Chemistry crash course with PYQs & mocks.',
    price: 2999,
    mrp: 5999,
    durationMonths: 3,
    instructor: 'ChemPrep Faculty Team',
    highlights: ['Crash Lectures', 'PYQs', '10 Mocks'],
    syllabus: ['NCERT based Chemistry', 'Application Problems'],
    studentsEnrolled: 120,
  },
  {
    title: 'TIFR Chemistry Preparation',
    category: 'TIFR',
    level: 'Advanced',
    thumbnail:
      'https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=900&auto=format&fit=crop&q=80',
    shortDescription: 'TIFR GS Chemistry entrance preparation.',
    description: 'TIFR Chemistry prep with deep concept clarity and problem solving.',
    price: 5499,
    mrp: 9999,
    durationMonths: 6,
    instructor: 'Dr. A. Bose',
    highlights: ['Concept Deep Dive', 'PYQs', 'Interview Guidance'],
    syllabus: ['Physical', 'Organic', 'Inorganic', 'Spectroscopy'],
    studentsEnrolled: 80,
  },
  {
    title: 'Chemistry Foundation Class 11-12',
    category: 'FOUNDATION',
    level: 'Beginner',
    thumbnail:
      'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=900&auto=format&fit=crop&q=80',
    shortDescription: 'Strong foundation for Class 11 & 12 Chemistry students.',
    description: 'Build a rock-solid foundation for boards + competitive exams.',
    price: 3499,
    mrp: 6999,
    durationMonths: 10,
    instructor: 'ChemPrep Faculty',
    highlights: ['Board + JEE/NEET Aligned', 'NCERT Coverage', 'Weekly Tests'],
    syllabus: ['Class 11 Full', 'Class 12 Full'],
    studentsEnrolled: 430,
  },
];

const banners = [
  {
    type: 'banner',
    title: 'India’s #1 Chemistry LMS',
    subtitle: 'JEE • NEET • CSIR-NET • GATE • IIT-JAM • IAT • NEST • TIFR',
    description: 'Learn from IIT & IISc faculty. 10,000+ happy students. 500+ selections.',
    image:
      'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1600&auto=format&fit=crop&q=80',
    link: '/courses',
    order: 1,
  },
  {
    type: 'banner',
    title: 'New Batch Starting Soon',
    subtitle: 'JEE 2026 Chemistry Champion Batch',
    description: 'Enroll today and get 50% off + free printed notes.',
    image:
      'https://images.unsplash.com/photo-1554475901-4538ddfbccc2?w=1600&auto=format&fit=crop&q=80',
    link: '/courses?category=JEE',
    order: 2,
  },
  {
    type: 'banner',
    title: 'Crack CSIR-NET with Confidence',
    subtitle: 'AIR 1, 3, 7 from our batch in 2025',
    description: 'Join the most trusted CSIR-NET Chemistry program in India.',
    image:
      'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=1600&auto=format&fit=crop&q=80',
    link: '/courses?category=CSIR-NET',
    order: 3,
  },
  {
    type: 'banner',
    title: 'NEET Chemistry — NCERT Mastery',
    subtitle: 'Score 360/360 with our NCERT line-by-line program',
    description: 'Trusted by 25,000+ NEET aspirants across India.',
    image:
      'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=1600&auto=format&fit=crop&q=80',
    link: '/courses?category=NEET',
    order: 4,
  },
];

const highlights = [
  {
    type: 'highlight',
    title: 'Live + Recorded Classes',
    description: 'Attend interactive live classes or watch recorded HD lectures anytime.',
    image: '🎥',
  },
  {
    type: 'highlight',
    title: 'Expert IIT/IISc Faculty',
    description: 'Learn directly from India’s top Chemistry educators.',
    image: '👨‍🏫',
  },
  {
    type: 'highlight',
    title: 'All India Test Series',
    description: 'Compete with thousands of students & track your AIR.',
    image: '📊',
  },
  {
    type: 'highlight',
    title: 'Printed + Digital Notes',
    description: 'High-quality notes delivered to your doorstep + PDFs.',
    image: '📚',
  },
  {
    type: 'highlight',
    title: '24x7 Doubt Support',
    description: 'Ask doubts anytime — get resolved within 2 hours.',
    image: '💬',
  },
  {
    type: 'highlight',
    title: 'Mobile + Web App',
    description: 'Learn on the go with our intuitive mobile + web platform.',
    image: '📱',
  },
];

const toppers = [
  {
    type: 'topper',
    title: 'Aarav Mehta',
    exam: 'JEE Advanced',
    rank: 'AIR 12',
    year: '2025',
    image:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop',
    description: 'Chemistry 98/100. "ChemPrep’s Organic module is gold."',
  },
  {
    type: 'topper',
    title: 'Priya Sharma',
    exam: 'NEET UG',
    rank: 'AIR 8',
    year: '2025',
    image:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop',
    description: '360/360 in Chemistry — credit to NCERT line-by-line lectures.',
  },
  {
    type: 'topper',
    title: 'Rohit Verma',
    exam: 'CSIR-NET',
    rank: 'AIR 3',
    year: '2025',
    image:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop',
    description: 'Cleared with JRF in first attempt.',
  },
  {
    type: 'topper',
    title: 'Ishita Rao',
    exam: 'GATE CY',
    rank: 'AIR 15',
    year: '2025',
    image:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&auto=format&fit=crop',
    description: 'Scored 78 marks. Joined IISc Bangalore.',
  },
  {
    type: 'topper',
    title: 'Kabir Singh',
    exam: 'IIT-JAM',
    rank: 'AIR 22',
    year: '2025',
    image:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop',
    description: 'Selected for IIT Bombay M.Sc Chemistry.',
  },
  {
    type: 'topper',
    title: 'Ananya Gupta',
    exam: 'NEST',
    rank: 'AIR 5',
    year: '2025',
    image:
      'https://images.unsplash.com/photo-1534751516642-a1af1ef26a56?w=400&auto=format&fit=crop',
    description: 'Joined NISER Bhubaneswar.',
  },
];

const reviews = [
  {
    type: 'review',
    author: 'Neha K.',
    title: 'Best Chemistry LMS out there',
    description:
      'The way Organic Chemistry is taught here is simply outstanding. Cleared JEE Advanced thanks to ChemPrep.',
    rating: 5,
    image:
      'https://images.unsplash.com/photo-1554151228-14d9def656e4?w=200&auto=format&fit=crop',
  },
  {
    type: 'review',
    author: 'Siddharth M.',
    title: 'Fantastic Mock Test Series',
    description: 'Mock tests replicate the real exam perfectly. Highly recommended for GATE CY.',
    rating: 5,
    image:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop',
  },
  {
    type: 'review',
    author: 'Dr. Meena R.',
    title: 'Superb for CSIR-NET',
    description: 'My students cleared CSIR-NET JRF in first attempt using this platform.',
    rating: 5,
    image:
      'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200&auto=format&fit=crop',
  },
  {
    type: 'review',
    author: 'Rahul T.',
    title: 'Doubt support is incredible',
    description: 'Any doubt I post gets resolved within an hour. 10/10.',
    rating: 5,
    image:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop',
  },
];

const videos = [
  {
    type: 'video',
    title: 'Organic Chemistry in 60 seconds',
    description: 'Quick revision of GOC fundamentals.',
    videoUrl: 'https://www.youtube.com/embed/FSyAehMdpyI',
    image:
      'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=600&auto=format&fit=crop&q=80',
  },
  {
    type: 'video',
    title: 'Mole Concept Master Class',
    description: 'Crack any mole concept question.',
    videoUrl: 'https://www.youtube.com/embed/Rw_pDVbnfQk',
    image:
      'https://images.unsplash.com/photo-1554475901-4538ddfbccc2?w=600&auto=format&fit=crop&q=80',
  },
  {
    type: 'video',
    title: 'Coordination Compounds — Shortcut',
    description: 'Quick tricks for JEE & NEET.',
    videoUrl: 'https://www.youtube.com/embed/wqbw_mGqwHg',
    image:
      'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=600&auto=format&fit=crop&q=80',
  },
];

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected. Clearing collections…');

  await Promise.all([
    User.deleteMany({ email: 'admin@chemprep.com' }),
    Course.deleteMany({}),
    Content.deleteMany({}),
  ]);

  const adminPass = await bcrypt.hash('Admin@123', 10);
  await User.create({
    name: 'Super Admin',
    email: 'admin@chemprep.com',
    password: adminPass,
    role: 'admin',
    studentId: 'ADMIN001',
  });

  await Course.insertMany(
    courses.map((c) => ({
      ...c,
      slug:
        c.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '') +
        '-' +
        Math.random().toString(36).slice(2, 7),
    }))
  );

  await Content.insertMany([...banners, ...highlights, ...toppers, ...reviews, ...videos]);

  console.log('✅ Seeded successfully.');
  console.log('Admin login → admin@chemprep.com / Admin@123');
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
