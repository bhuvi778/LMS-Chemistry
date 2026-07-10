import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Course from './models/Course.js';
import Test from './models/Test.js';

dotenv.config();

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/chemprep_lms';

async function seed() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(mongoUri);
    console.log('✅ DB Connected.');

    // Delete existing test power courses to avoid duplicate slug error
    await Course.deleteMany({ slug: { $in: ['electrochemistry-in-15-days', 'aldehydes-in-7-days'] } });
    console.log('Removed any existing matching test power courses.');

    // Find a mock Test ID to associate with quizzes
    const testDoc = await Test.findOne({});
    const quizId = testDoc ? testDoc._id : null;
    console.log('Using Test ID for quiz attachment:', quizId);

    // ── 1. ELECTROCHEMISTRY IN 15 DAYS ──
    const electroPlan = [];
    const topicsList = [
      ["Galvanic vs Electrolytic Cell", "Components of Galvanic Cell", "Cell Representation", "Standard Hydrogen Electrode (SHE)"],
      ["Standard Reduction Potentials", "Electrochemical Series Applications", "Cell EMF Calculations"],
      ["Nernst Equation Formulation", "Equilibrium Constant Calculation", "Reaction Quotient Q Relationship"],
      ["Concentration Cells Introduction", "Electrode Concentration Cells", "Electrolyte Concentration Cells"],
      ["Conductance in Electrolytic Solutions", "Specific Conductance", "Equivalent Conductance"],
      ["Kohlrausch's Law of Independent Migration", "Applications of Kohlrausch's Law"],
      ["Faraday's First Law of Electrolysis", "Quantitative Electrolysis Calculations"],
      ["Faraday's Second Law of Electrolysis", "Equivalent Weights in Electrolysis"],
      ["Primary Batteries: Dry Cell and Mercury Cell", "Secondary Batteries: Lead Storage Battery"],
      ["Nickel-Cadmium Cell", "Fuel Cells (H2-O2 Cell) Principles and Efficiency"],
      ["Corrosion Mechanisms", "Factors Affecting Corrosion", "Rusting of Iron"],
      ["Prevention of Corrosion", "Cathodic Protection", "Galvanizing and Painting Methods"],
      ["Electrochemical Sensors Basics", "pH Electrode and Reference Electrodes"],
      ["Formula Revision Session", "Important Quick Revision Pointers"],
      ["Electrochemistry PYQs Solved Examples", "JEE/NEET Level Problem Sheets"]
    ];

    for (let day = 1; day <= 15; day++) {
      electroPlan.push({
        dayNumber: day,
        title: day === 1 ? "Electrochemical Cells - Introduction" :
               day === 2 ? "Cell Potential & Electrode Potential" :
               day === 3 ? "Nernst Equation" :
               day === 4 ? "Concentration Cells" :
               day === 5 ? "Conductance in Solutions" :
               day === 6 ? "Kohlrausch's Law" :
               day === 7 ? "Faraday's First Law" :
               day === 8 ? "Faraday's Second Law" :
               day === 9 ? "Primary and Secondary Batteries" :
               day === 10 ? "Fuel Cells & Battery Chemistry" :
               day === 11 ? "Corrosion and Rusting" :
               day === 12 ? "Corrosion Prevention" :
               day === 13 ? "Electrochemical Sensors" :
               day === 14 ? "Formula revision & summaries" : "PYQs & Practice Problems",
        description: `Complete all goals for Day ${day} to stay on track.`,
        durationText: "60 min",
        topicsCovered: topicsList[day - 1] || ["Core concepts revision", "Formula derivations"],
        videoUrl: "https://www.youtube.com/watch?v=9Lhbp22y7xs",
        videoTitle: `Electrochemistry Lecture video Day ${day}`,
        notesUrl: "https://chemprep-lms.s3.amazonaws.com/notes/electrochemistry_day" + day + ".pdf",
        notesTitle: `Day ${day} Lecture Notes PDF`,
        quizId: quizId,
        quizTitle: `Day ${day} Concept Quiz Checkpoint`,
        assignmentUrl: "https://chemprep-lms.s3.amazonaws.com/assignments/electrochemistry_day" + day + ".pdf",
        assignmentTitle: `Day ${day} Daily Practice Assignment`
      });
    }

    const course1 = await Course.create({
      title: "Electrochemistry in 15 Days",
      slug: "electrochemistry-in-15-days",
      subtitle: "Complete Revision Challenge",
      category: "JEE",
      categories: ["JEE", "CBSE"],
      subCategories: ["Physical Chemistry"],
      subject: "Chemistry",
      language: "Hinglish",
      thumbnail: "https://images.unsplash.com/photo-1607990283143-e81e7a2c93ab?q=80&w=600&auto=format&fit=crop",
      shortDescription: "Master Electrochemistry with concept clarity, formulas, PYQs, and daily worksheets in just 15 days.",
      description: "<p>This 15-day crash revision program is designed to help students master Electrochemistry. Each day includes conceptual videos, concise notes, practice questions, and a daily assignment to track progress.</p>",
      price: 399,
      mrp: 599,
      isPowerCourse: true,
      powerCourseType: "mini",
      powerCourseDuration: 15,
      dailyPlan: electroPlan,
      totalLessons: 45,
      instructor: "N.K. Sir",
      rating: 4.8,
      studentsEnrolled: 2436,
      isPublished: true,
      discountCoupons: [
        { code: "LAUNCH33", discountType: "percent", discountValue: 33, isActive: true },
        { code: "FLAT100", discountType: "amount", discountValue: 100, isActive: true }
      ]
    });
    console.log('✅ Created Course 1:', course1.title);

    // ── 2. ALDEHYDES IN 7 DAYS ──
    const aldehydePlan = [];
    const aldehydeTopics = [
      ["Nomenclature and Structure of Carbonyl Group", "Preparation of Aldehydes and Ketones"],
      ["Physical Properties of Aldehydes", "Chemical Reactions and Nucleophilic Addition"],
      ["Grignard Reagents Addition", "Addition of Alcohols and Hemiacetal Formation"],
      ["Aldol Condensation Mechanism", "Cross-Aldol Condensation Reactions"],
      ["Cannizzaro Reaction and Mechanisms", "Electrophilic Substitution Reactions"],
      ["Chemical Tests to Distinguish Aldehydes", "Tollens Test and Fehlings Solution Test"],
      ["Quick Mindmap Revision", "Aldehydes NEET Practice MCQ Sheet"]
    ];

    for (let day = 1; day <= 7; day++) {
      aldehydePlan.push({
        dayNumber: day,
        title: day === 1 ? "Carbonyl Nomenclature & Structures" :
               day === 2 ? "Chemical Reactions & Addition Mechanisms" :
               day === 3 ? "Addition of Grignard Reagents" :
               day === 4 ? "Aldol Condensation" :
               day === 5 ? "Cannizzaro Reaction" :
               day === 6 ? "Distinguishing Chemical Tests" : "Mindmap & Final Review",
        description: `Complete carbonyl targets for Day ${day}.`,
        durationText: "50 min",
        topicsCovered: aldehydeTopics[day - 1] || ["Carbonyl properties", "Practice exercises"],
        videoUrl: "https://www.youtube.com/watch?v=9Lhbp22y7xs",
        videoTitle: `Aldehydes Lecture video Day ${day}`,
        notesUrl: "https://chemprep-lms.s3.amazonaws.com/notes/aldehydes_day" + day + ".pdf",
        notesTitle: `Day ${day} Lecture Notes PDF`,
        quizId: quizId,
        quizTitle: `Day ${day} Concept Quiz Checkpoint`,
        assignmentUrl: "https://chemprep-lms.s3.amazonaws.com/assignments/aldehydes_day" + day + ".pdf",
        assignmentTitle: `Day ${day} Daily Practice Assignment`
      });
    }

    const course2 = await Course.create({
      title: "Aldehydes in 7 Days",
      slug: "aldehydes-in-7-days",
      subtitle: "Quick Concept Mastery",
      category: "NEET",
      categories: ["NEET", "CBSE"],
      subCategories: ["Organic Chemistry"],
      subject: "Chemistry",
      language: "Hinglish",
      thumbnail: "https://images.unsplash.com/photo-1532187643603-ba119ca4109e?q=80&w=600&auto=format&fit=crop",
      shortDescription: "Master Aldehydes and Ketones mechanisms, conversions, and name reactions in just 7 days.",
      description: "<p>Quick Aldehydes concept builder with name reactions, worksheets, mindmaps, and online mock quizzes.</p>",
      price: 199,
      mrp: 299,
      isPowerCourse: true,
      powerCourseType: "micro",
      powerCourseDuration: 7,
      dailyPlan: aldehydePlan,
      totalLessons: 21,
      instructor: "N.K. Sir",
      rating: 4.7,
      studentsEnrolled: 189,
      isPublished: true,
      discountCoupons: [
        { code: "ALDE50", discountType: "percent", discountValue: 50, isActive: true }
      ]
    });
    console.log('✅ Created Course 2:', course2.title);

  } catch (err) {
    console.error('❌ Seeding failed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from DB.');
  }
}

seed();
