import SyllabusSubject from '../models/SyllabusSubject.js';
import StudentSyllabusProgress from '../models/StudentSyllabusProgress.js';
import PlannerGoal from '../models/PlannerGoal.js';
import MentorshipBooking from '../models/MentorshipBooking.js';
import MentorshipSetting from '../models/MentorshipSetting.js';
import LiveClass from '../models/LiveClass.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import asyncHandler from 'express-async-handler';
import {
  sendMentorshipRequestAdminEmail,
  sendMentorshipRequestStudentEmail,
  sendMentorshipScheduledAdminEmail,
  sendMentorshipScheduledStudentEmail,
} from '../services/email.js';

// Seeding default Chemistry syllabus data
const defaultSyllabus = [
  {
    name: "Physical Chemistry",
    categories: ["CBSE", "NEET", "JEE"],
    chapters: [
      {
        name: "Chemical Kinetics",
        topics: [
          {
            name: "Rate Laws & Order of Reactions",
            subTopics: [
              { name: "Rate Law Expression & Integrated Rate Equations", hasVideo: true, hasNotes: true, hasDpp: true, hasDppVideo: true, hasMockTest: true },
              { name: "First Order & Zero Order Reactions", hasVideo: true, hasNotes: true, hasDpp: true, hasDppVideo: true, hasMockTest: true },
              { name: "Half-Life Calculations", hasVideo: true, hasNotes: true, hasDpp: true, hasDppVideo: false, hasMockTest: true }
            ]
          },
          {
            name: "Activation Energy & Arrhenius Equation",
            subTopics: [
              { name: "Collision Theory of Reaction Rates", hasVideo: true, hasNotes: true, hasDpp: true, hasDppVideo: true, hasMockTest: false },
              { name: "Arrhenius Equation & Effect of Temperature", hasVideo: true, hasNotes: true, hasDpp: true, hasDppVideo: true, hasMockTest: true }
            ]
          }
        ]
      },
      {
        name: "Electrochemistry",
        topics: [
          {
            name: "Galvanic & Electrolytic Cells",
            subTopics: [
              { name: "Nernst Equation & Cell Potential", hasVideo: true, hasNotes: true, hasDpp: true, hasDppVideo: true, hasMockTest: true },
              { name: "Gibbs Free Energy & Cell EMF", hasVideo: true, hasNotes: true, hasDpp: true, hasDppVideo: false, hasMockTest: true }
            ]
          }
        ]
      }
    ]
  },
  {
    name: "Organic Chemistry",
    categories: ["CBSE", "NEET", "JEE"],
    chapters: [
      {
        name: "Aldehydes, Ketones & Carboxylic Acids",
        topics: [
          {
            name: "Nomenclature & Structure",
            subTopics: [
              { name: "IUPAC Nomenclature & Carbonyl Carbon Properties", hasVideo: true, hasNotes: true, hasDpp: true, hasDppVideo: false, hasMockTest: true },
              { name: "Nucleophilic Addition Reactions", hasVideo: true, hasNotes: true, hasDpp: true, hasDppVideo: true, hasMockTest: true }
            ]
          },
          {
            name: "Named Organic Reactions",
            subTopics: [
              { name: "Aldol Condensation & Cannizzaro Reaction", hasVideo: true, hasNotes: true, hasDpp: true, hasDppVideo: true, hasMockTest: true },
              { name: "Clemmensen & Wolff-Kishner Reduction", hasVideo: true, hasNotes: true, hasDpp: true, hasDppVideo: true, hasMockTest: true }
            ]
          }
        ]
      }
    ]
  },
  {
    name: "Inorganic Chemistry",
    categories: ["CBSE", "NEET", "JEE"],
    chapters: [
      {
        name: "Coordination Compounds",
        topics: [
          {
            name: "Bonding theories",
            subTopics: [
              { name: "Valence Bond Theory (VBT)", hasVideo: true, hasNotes: true, hasDpp: true, hasDppVideo: false, hasMockTest: true },
              { name: "Crystal Field Theory (CFT)", hasVideo: true, hasNotes: true, hasDpp: true, hasDppVideo: true, hasMockTest: true }
            ]
          }
        ]
      }
    ]
  }
];

// Helper to check if a student has Pro or Infinity plan
const checkProInfinityAccess = async (studentId) => {
  const Enrollment = (await import('../models/Enrollment.js')).default;
  const count = await Enrollment.countDocuments({
    student: studentId,
    paymentStatus: 'paid',
    planType: { $in: ['pro', 'infinity'] }
  });
  return count > 0;
};

// Helper to check if a student has Infinity plan
const checkInfinityAccess = async (studentId) => {
  const Enrollment = (await import('../models/Enrollment.js')).default;
  const count = await Enrollment.countDocuments({
    student: studentId,
    paymentStatus: 'paid',
    planType: 'infinity'
  });
  return count > 0;
};

const DEFAULT_MENTORSHIP_SETTINGS = {
  enabled: true,
  availableDates: [],
  availableSlots: [],
  mentorshipMonthlyLimit: 2,
  doubtMonthlyLimit: 4,
  doubtWeeklyLimit: 1,
};

const getEffectiveMentorshipSettings = async ({ courseId, category } = {}) => {
  let settings = null;
  if (courseId) {
    settings = await MentorshipSetting.findOne({ targetType: 'course', targetId: courseId });
  }
  if (!settings && category) {
    settings = await MentorshipSetting.findOne({ targetType: 'category', targetId: category });
  }
  if (!settings) {
    settings = await MentorshipSetting.findOne({ targetType: 'global', targetId: 'global' });
  }
  return settings || DEFAULT_MENTORSHIP_SETTINGS;
};

const sanitizeLimit = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : fallback;
};

const getMonthRange = (date) => {
  const start = new Date(date);
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  return { start, end };
};

const getWeekRange = (date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return { start, end };
};

const getSessionTypeLabel = (sessionType) => (
  sessionType === 'doubt' ? '1:1 Doubt' : '1:1 Session'
);

const splitEmails = (value = '') => String(value)
  .split(',')
  .map((email) => email.trim())
  .filter(Boolean);

const getMentorshipAdminEmails = async () => {
  const configuredEmails = [
    ...splitEmails(process.env.MENTORSHIP_ADMIN_EMAIL),
    ...splitEmails(process.env.ADMIN_EMAIL),
    ...splitEmails(process.env.SMTP_ADMIN_EMAIL),
  ];
  const adminUsers = await User.find({ role: 'admin', email: { $nin: ['', null] } }).select('email');
  const emails = [...configuredEmails, ...adminUsers.map((admin) => admin.email)].filter(Boolean);
  if (!emails.length) emails.push(process.env.SMTP_USER || 'admin@ace2examz.com');
  return [...new Set(emails)];
};

const notifyAdminsAboutMentorship = async (title, message) => {
  const admins = await User.find({ role: 'admin' }).select('_id');
  if (!admins.length) return;
  await Notification.insertMany(
    admins.map((admin) => ({
      user: admin._id,
      title,
      message,
      type: 'system',
      link: '/admin/mentorship',
    })),
    { ordered: false }
  ).catch(() => {});
};

const parseSlotStart = (slot = '') => {
  const firstPart = String(slot).split(/\s*(?:-|to|To|TO)\s*/)[0]?.trim() || '';
  const match = firstPart.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i);
  if (!match) return { hours: 10, minutes: 0 };
  let hours = Number(match[1]);
  const minutes = Number(match[2] || 0);
  const period = match[3]?.toUpperCase();
  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return { hours, minutes };
};

const getScheduledAtFromBooking = (preferredDate, preferredTimeSlot) => {
  const scheduledAt = new Date(preferredDate);
  const { hours, minutes } = parseSlotStart(preferredTimeSlot);
  scheduledAt.setHours(hours, minutes, 0, 0);
  return scheduledAt;
};

const getDurationFromSlot = (preferredTimeSlot) => {
  const parts = String(preferredTimeSlot || '').split(/\s*(?:-|to)\s*/i).filter(Boolean);
  if (parts.length < 2) return 60;
  const start = parseSlotStart(parts[0]);
  const end = parseSlotStart(parts[1]);
  const startMins = start.hours * 60 + start.minutes;
  const endMins = end.hours * 60 + end.minutes;
  return endMins > startMins ? endMins - startMins : 60;
};

// ==========================================
// 1. Syllabus Tracker Controllers
// ==========================================

export const getSyllabus = asyncHandler(async (req, res) => {
  // Ensure we have seeded default data if syllabus is empty
  let list = await SyllabusSubject.find().sort({ name: 1 });
  if (list.length === 0) {
    await SyllabusSubject.insertMany(defaultSyllabus);
    list = await SyllabusSubject.find().sort({ name: 1 });
  }

  // Admin gets everything
  if (req.user.role === 'admin') {
    return res.json(list);
  }

  // Students filter by categories from their Pro/Infinity enrollments
  const Enrollment = (await import('../models/Enrollment.js')).default;
  const enrolls = await Enrollment.find({ student: req.user._id, paymentStatus: 'paid' })
    .populate('course');

  const activeCategories = [];
  for (const e of enrolls) {
    if (e.course && (e.planType === 'pro' || e.planType === 'infinity')) {
      const courseCats = e.course.categories || [];
      if (courseCats.length > 0) {
        courseCats.forEach(c => {
          if (!activeCategories.includes(c)) activeCategories.push(c);
        });
      } else if (e.course.category && !activeCategories.includes(e.course.category)) {
        activeCategories.push(e.course.category);
      }
    }
  }

  if (activeCategories.length === 0) {
    return res.json([]); // Not enrolled in any Pro/Infinity course
  }

  const { category } = req.query;
  let query = {};
  if (category) {
    if (!activeCategories.includes(category)) {
      return res.json([]); // Cannot request a category you are not enrolled in
    }
    query.categories = category;
  } else {
    query.categories = { $in: activeCategories };
  }

  const filteredList = await SyllabusSubject.find(query).sort({ name: 1 });
  res.json(filteredList);
});

export const createSubject = asyncHandler(async (req, res) => {
  const { name, categories } = req.body;
  if (!name) {
    res.status(400);
    throw new Error('Subject name is required');
  }

  // Prevent duplicate subject names in the same category (case-insensitive match)
  const trimmedName = name.trim();
  const newCategories = categories || [];
  const existingSubjects = await SyllabusSubject.find({
    name: { $regex: new RegExp('^' + trimmedName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') }
  });

  const hasOverlap = existingSubjects.some(sub => 
    sub.categories.some(cat => newCategories.includes(cat))
  );

  if (hasOverlap) {
    res.status(400);
    throw new Error('A subject with this name already exists for one of the selected categories.');
  }

  const subject = await SyllabusSubject.create({ 
    name: trimmedName, 
    categories: newCategories, 
    chapters: [] 
  });
  res.status(201).json(subject);
});

export const updateSubject = asyncHandler(async (req, res) => {
  const { name, categories } = req.body;
  const subject = await SyllabusSubject.findById(req.params.id);
  if (!subject) {
    res.status(404);
    throw new Error('Subject not found');
  }

  const newName = name !== undefined ? name.trim() : subject.name;
  const newCategories = categories !== undefined ? categories : subject.categories;

  // Check if there's another subject with the same name that overlaps in categories
  const duplicateSubjects = await SyllabusSubject.find({
    _id: { $ne: subject._id },
    name: { $regex: new RegExp('^' + newName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') }
  });

  const hasOverlap = duplicateSubjects.some(sub => 
    sub.categories.some(cat => newCategories.includes(cat))
  );

  if (hasOverlap) {
    res.status(400);
    throw new Error('Another subject with this name already exists for one of the selected categories.');
  }

  if (name !== undefined) subject.name = newName;
  if (categories !== undefined) subject.categories = newCategories;
  await subject.save();
  res.json(subject);
});

export const deleteSubject = asyncHandler(async (req, res) => {
  await SyllabusSubject.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

export const createChapter = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name) {
    res.status(400);
    throw new Error('Chapter name is required');
  }
  const subject = await SyllabusSubject.findById(req.params.id);
  if (!subject) {
    res.status(404);
    throw new Error('Subject not found');
  }
  subject.chapters.push({ name, topics: [] });
  await subject.save();
  res.status(201).json(subject);
});

export const deleteChapter = asyncHandler(async (req, res) => {
  const { subjectId, chapterId } = req.params;
  const subject = await SyllabusSubject.findById(subjectId);
  if (!subject) {
    res.status(404);
    throw new Error('Subject not found');
  }
  subject.chapters = subject.chapters.filter(c => c._id.toString() !== chapterId);
  await subject.save();
  res.json(subject);
});

export const createTopic = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name) {
    res.status(400);
    throw new Error('Topic name is required');
  }
  const { subjectId, chapterId } = req.params;
  const subject = await SyllabusSubject.findById(subjectId);
  if (!subject) {
    res.status(404);
    throw new Error('Subject not found');
  }
  const chapter = subject.chapters.id(chapterId);
  if (!chapter) {
    res.status(404);
    throw new Error('Chapter not found');
  }
  chapter.topics.push({ name, subTopics: [] });
  await subject.save();
  res.status(201).json(subject);
});

export const deleteTopic = asyncHandler(async (req, res) => {
  const { subjectId, chapterId, topicId } = req.params;
  const subject = await SyllabusSubject.findById(subjectId);
  if (!subject) {
    res.status(404);
    throw new Error('Subject not found');
  }
  const chapter = subject.chapters.id(chapterId);
  if (!chapter) {
    res.status(404);
    throw new Error('Chapter not found');
  }
  chapter.topics = chapter.topics.filter(t => t._id.toString() !== topicId);
  await subject.save();
  res.json(subject);
});

export const createSubTopic = asyncHandler(async (req, res) => {
  const { name, hasVideo, hasNotes, hasDpp, hasDppVideo, hasMockTest, hasPyq, subTopicId } = req.body;
  if (!name) {
    res.status(400);
    throw new Error('Subtopic name is required');
  }
  const { subjectId, chapterId, topicId } = req.params;
  const subject = await SyllabusSubject.findById(subjectId);
  if (!subject) {
    res.status(404);
    throw new Error('Subject not found');
  }
  const chapter = subject.chapters.id(chapterId);
  if (!chapter) {
    res.status(404);
    throw new Error('Chapter not found');
  }
  const topic = chapter.topics.id(topicId);
  if (!topic) {
    res.status(404);
    throw new Error('Topic not found');
  }

  if (subTopicId) {
    // Edit existing subtopic
    const subTopic = topic.subTopics.id(subTopicId);
    if (!subTopic) {
      res.status(404);
      throw new Error('Subtopic not found');
    }
    subTopic.name = name;
    subTopic.hasVideo = hasVideo !== undefined ? hasVideo : subTopic.hasVideo;
    subTopic.hasNotes = hasNotes !== undefined ? hasNotes : subTopic.hasNotes;
    subTopic.hasDpp = hasDpp !== undefined ? hasDpp : subTopic.hasDpp;
    subTopic.hasDppVideo = hasDppVideo !== undefined ? hasDppVideo : subTopic.hasDppVideo;
    subTopic.hasMockTest = hasMockTest !== undefined ? hasMockTest : subTopic.hasMockTest;
    subTopic.hasPyq = hasPyq !== undefined ? hasPyq : subTopic.hasPyq;
  } else {
    // Create new subtopic
    topic.subTopics.push({
      name,
      hasVideo: hasVideo !== undefined ? hasVideo : true,
      hasNotes: hasNotes !== undefined ? hasNotes : true,
      hasDpp: hasDpp !== undefined ? hasDpp : true,
      hasDppVideo: hasDppVideo !== undefined ? hasDppVideo : true,
      hasMockTest: hasMockTest !== undefined ? hasMockTest : true,
      hasPyq: hasPyq !== undefined ? hasPyq : true
    });
  }

  await subject.save();
  res.status(201).json(subject);
});

export const deleteSubTopic = asyncHandler(async (req, res) => {
  const { subjectId, chapterId, topicId, subTopicId } = req.params;
  const subject = await SyllabusSubject.findById(subjectId);
  if (!subject) {
    res.status(404);
    throw new Error('Subject not found');
  }
  const chapter = subject.chapters.id(chapterId);
  if (!chapter) {
    res.status(404);
    throw new Error('Chapter not found');
  }
  const topic = chapter.topics.id(topicId);
  if (!topic) {
    res.status(404);
    throw new Error('Topic not found');
  }
  topic.subTopics.pull(subTopicId);
  await subject.save();
  res.json(subject);
});

export const getStudentProgress = asyncHandler(async (req, res) => {
  const progressList = await StudentSyllabusProgress.find({ student: req.user._id });
  res.json(progressList);
});

export const toggleProgress = asyncHandler(async (req, res) => {
  const { subTopicId, itemType } = req.body;
  if (!subTopicId || !itemType) {
    res.status(400);
    throw new Error('subTopicId and itemType are required');
  }

  const validTypes = ['video', 'notes', 'dpp', 'dppVideo', 'mockTest'];
  if (!validTypes.includes(itemType)) {
    res.status(400);
    throw new Error('Invalid itemType');
  }

  let progress = await StudentSyllabusProgress.findOne({
    student: req.user._id,
    subTopicId
  });

  if (!progress) {
    progress = new StudentSyllabusProgress({
      student: req.user._id,
      subTopicId,
      completedItems: [itemType]
    });
  } else {
    if (progress.completedItems.includes(itemType)) {
      progress.completedItems = progress.completedItems.filter(item => item !== itemType);
    } else {
      progress.completedItems.push(itemType);
    }
  }

  await progress.save();
  res.json(progress);
});

// ==========================================
// 2. My Planner Controllers
// ==========================================

export const getPlannerGoals = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    const hasAccess = await checkProInfinityAccess(req.user._id);
    if (!hasAccess) {
      res.status(403);
      throw new Error('Access denied. Pro or Infinity plan is required to use the Planner.');
    }
  }
  const { startDate, endDate } = req.query;
  const query = { student: req.user._id };

  if (startDate && endDate) {
    query.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const goals = await PlannerGoal.find(query).sort({ date: 1, createdAt: 1 });
  res.json(goals);
});

export const createPlannerGoal = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    const hasAccess = await checkProInfinityAccess(req.user._id);
    if (!hasAccess) {
      res.status(403);
      throw new Error('Access denied. Pro or Infinity plan is required to use the Planner.');
    }
  }
  const { date, title, associatedSubTopic, associatedActivity } = req.body;
  if (!date || !title) {
    res.status(400);
    throw new Error('date and title are required');
  }

  const goal = await PlannerGoal.create({
    student: req.user._id,
    date: new Date(date),
    title,
    associatedSubTopic: associatedSubTopic || '',
    associatedActivity: associatedActivity || '',
    isCompleted: false,
    coinAwarded: false
  });

  res.status(201).json(goal);
});

export const togglePlannerGoal = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    const hasAccess = await checkProInfinityAccess(req.user._id);
    if (!hasAccess) {
      res.status(403);
      throw new Error('Access denied. Pro or Infinity plan is required to use the Planner.');
    }
  }
  const { id } = req.params;
  const { isCompleted } = req.body;

  const goal = await PlannerGoal.findOne({ _id: id, student: req.user._id });
  if (!goal) {
    res.status(404);
    throw new Error('Planner goal not found');
  }

  let coinsAdded = 0;
  goal.isCompleted = !!isCompleted;
  if (goal.isCompleted) {
    goal.completedAt = new Date();
    // Award +1 coin if not already awarded
    if (!goal.coinAwarded) {
      goal.coinAwarded = true;
      coinsAdded = 1;
      
      // Update student's wallet
      const student = await User.findById(req.user._id);
      if (student) {
        student.coins = (student.coins || 0) + 1;
        await student.save();
      }
    }
  } else {
    goal.completedAt = null;
  }

  await goal.save();

  // Fetch updated user coin count to return
  const updatedUser = await User.findById(req.user._id).select('coins');

  res.json({
    goal,
    coinsAdded,
    totalCoins: updatedUser ? updatedUser.coins : 0
  });
});

export const deletePlannerGoal = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    const hasAccess = await checkProInfinityAccess(req.user._id);
    if (!hasAccess) {
      res.status(403);
      throw new Error('Access denied. Pro or Infinity plan is required to use the Planner.');
    }
  }
  const goal = await PlannerGoal.findOneAndDelete({ _id: req.params.id, student: req.user._id });
  if (!goal) {
    res.status(404);
    throw new Error('Planner goal not found');
  }
  res.json({ ok: true });
});

// ==========================================
// 3. 1:1 Session Controllers
// ==========================================

export const requestMentorship = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    const hasAccess = await checkInfinityAccess(req.user._id);
    if (!hasAccess) {
      res.status(403);
      throw new Error('Access denied. 1:1 Session is exclusively available for Infinity plan subscribers.');
    }
  }
  const { subject, description, preferredDate, preferredTimeSlot, courseId, category } = req.body;
  const sessionType = req.body.sessionType === 'doubt' ? 'doubt' : 'mentorship';
  if (!subject || !description || !preferredDate || !preferredTimeSlot) {
    res.status(400);
    throw new Error('All fields are required');
  }

  // Look up Mentorship Settings (Course -> Category -> Global)
  const settings = await getEffectiveMentorshipSettings({ courseId, category });

  // Enforce settings if configured
  if (settings) {
    if (!settings.enabled) {
      res.status(400);
      throw new Error('1:1 sessions are currently closed.');
    }
    
    // If availableDates are explicitly defined, validate the selection
    if (settings.availableDates && settings.availableDates.length > 0) {
      const selectedDateStr = new Date(preferredDate).toISOString().split('T')[0];
      if (!settings.availableDates.includes(selectedDateStr)) {
        res.status(400);
        throw new Error('The selected date is not available for booking.');
      }
    }

    // If availableSlots are explicitly defined, validate the selection
    if (settings.availableSlots && settings.availableSlots.length > 0) {
      if (!settings.availableSlots.includes(preferredTimeSlot)) {
        res.status(400);
        throw new Error('The selected time slot is not available for booking.');
      }
    }
  }

  const selectedDate = new Date(preferredDate);
  const monthRange = getMonthRange(selectedDate);
  const activeStatuses = { $ne: 'Cancelled' };
  const monthlyCount = await MentorshipBooking.countDocuments({
    student: req.user._id,
    sessionType,
    status: activeStatuses,
    preferredDate: { $gte: monthRange.start, $lt: monthRange.end },
  });

  if (sessionType === 'mentorship') {
    const monthlyLimit = sanitizeLimit(settings.mentorshipMonthlyLimit, DEFAULT_MENTORSHIP_SETTINGS.mentorshipMonthlyLimit);
    if (monthlyLimit > 0 && monthlyCount >= monthlyLimit) {
      res.status(400);
      throw new Error(`You can book only ${monthlyLimit} 1:1 Session${monthlyLimit === 1 ? '' : 's'} per month.`);
    }
  } else {
    const monthlyLimit = sanitizeLimit(settings.doubtMonthlyLimit, DEFAULT_MENTORSHIP_SETTINGS.doubtMonthlyLimit);
    const weeklyLimit = sanitizeLimit(settings.doubtWeeklyLimit, DEFAULT_MENTORSHIP_SETTINGS.doubtWeeklyLimit);
    if (monthlyLimit > 0 && monthlyCount >= monthlyLimit) {
      res.status(400);
      throw new Error(`You can book only ${monthlyLimit} 1:1 Doubt session${monthlyLimit === 1 ? '' : 's'} per month.`);
    }
    const weekRange = getWeekRange(selectedDate);
    const weeklyCount = await MentorshipBooking.countDocuments({
      student: req.user._id,
      sessionType,
      status: activeStatuses,
      preferredDate: { $gte: weekRange.start, $lt: weekRange.end },
    });
    if (weeklyLimit > 0 && weeklyCount >= weeklyLimit) {
      res.status(400);
      throw new Error(`You can book only ${weeklyLimit} 1:1 Doubt session${weeklyLimit === 1 ? '' : 's'} per week.`);
    }
  }

  const booking = await MentorshipBooking.create({
    student: req.user._id,
    sessionType,
    course: courseId || null,
    category: category || '',
    subject,
    description,
    preferredDate: selectedDate,
    preferredTimeSlot,
    status: 'Pending'
  });

  // Trigger non-blocking email notifications
  if (req.user && req.user.email) {
    sendMentorshipRequestStudentEmail(req.user.email, req.user.name, booking).catch(() => {});
  }

  const adminEmails = await getMentorshipAdminEmails();
  adminEmails.forEach((email) => {
    sendMentorshipRequestAdminEmail(email, req.user.name || 'Student', booking).catch(() => {});
  });
  await notifyAdminsAboutMentorship(
    'New 1:1 Session Request',
    `${req.user.name || 'A student'} requested a session for "${subject}".`
  );

  res.status(201).json(booking);
});

export const getMentorshipBookings = asyncHandler(async (req, res) => {
  if (req.user.role === 'admin') {
    const list = await MentorshipBooking.find()
      .populate('student', 'name email studentId phone avatar')
      .populate('course', 'title category')
      .populate('liveClass', 'title scheduledAt durationMins meetingUrl meetLink platform roomId')
      .sort({ createdAt: -1 });
    res.json(list);
  } else {
    const hasAccess = await checkInfinityAccess(req.user._id);
    if (!hasAccess) {
      res.status(403);
      throw new Error('Access denied. 1:1 Session is exclusively available for Infinity plan subscribers.');
    }
    const list = await MentorshipBooking.find({ student: req.user._id })
      .populate('course', 'title category')
      .populate('liveClass', 'title scheduledAt durationMins meetingUrl meetLink platform roomId')
      .sort({ preferredDate: -1 });
    res.json(list);
  }
});

export const updateMentorshipBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    status,
    mentorName,
    meetingLink,
    sessionNotes,
    studyPlan,
    preferredDate,
    preferredTimeSlot,
    createLiveClass,
  } = req.body;

  const booking = await MentorshipBooking.findById(id);
  if (!booking) {
    res.status(404);
    throw new Error('1:1 session booking not found');
  }

  if (status !== undefined) booking.status = status;
  if (mentorName !== undefined) booking.mentorName = mentorName;
  if (meetingLink !== undefined) booking.meetingLink = meetingLink;
  if (sessionNotes !== undefined) booking.sessionNotes = sessionNotes;
  if (studyPlan !== undefined) booking.studyPlan = studyPlan;
  if (preferredDate !== undefined) booking.preferredDate = new Date(preferredDate);
  if (preferredTimeSlot !== undefined) booking.preferredTimeSlot = preferredTimeSlot;

  await booking.save();

  if (booking.status === 'Scheduled' && createLiveClass === true) {
    const sessionLabel = getSessionTypeLabel(booking.sessionType);
    const liveClassPayload = {
      title: `${sessionLabel}: ${booking.subject}`,
      description: booking.description || '',
      course: booking.course || null,
      courses: booking.course ? [booking.course] : [],
      courseName: booking.category || '',
      instructor: booking.mentorName || 'Ace2Examz Mentor',
      scheduledAt: getScheduledAtFromBooking(booking.preferredDate, booking.preferredTimeSlot),
      durationMins: getDurationFromSlot(booking.preferredTimeSlot),
      isActive: true,
      status: 'scheduled',
      platform: 'internal',
      useInternalRoom: true,
      meetLink: '',
      meetingUrl: '',
    };

    let liveClass = booking.liveClass ? await LiveClass.findById(booking.liveClass) : null;
    if (liveClass) {
      Object.assign(liveClass, liveClassPayload);
      await liveClass.save();
    } else {
      liveClass = await LiveClass.create(liveClassPayload);
      booking.liveClass = liveClass._id;
    }

    booking.meetingLink = `/live/${liveClass._id}`;
    await booking.save();
  } else if (createLiveClass === false && booking.liveClass) {
    await LiveClass.findByIdAndDelete(booking.liveClass).catch(() => {});
    booking.liveClass = null;
    if (String(booking.meetingLink || '').startsWith('/live/')) {
      booking.meetingLink = '';
    }
    await booking.save();
  }

  // Create notifications for the student when status updates or session resources are uploaded
  const sessionLabel = getSessionTypeLabel(booking.sessionType);
  let notifMessage = `Your ${sessionLabel} session regarding "${booking.subject}" is now updated.`;
  if (status === 'Scheduled') {
    notifMessage = `Your ${sessionLabel} session for "${booking.subject}" is scheduled with ${booking.mentorName} on ${new Date(booking.preferredDate).toLocaleDateString()}.`;
  } else if (status === 'Completed') {
    notifMessage = `Your ${sessionLabel} session for "${booking.subject}" has been marked Completed. View feedback & study materials.`;
  } else if (status === 'Cancelled') {
    notifMessage = `Your ${sessionLabel} session for "${booking.subject}" has been Cancelled.`;
  }

  await Notification.create({
    user: booking.student,
    title: `${sessionLabel} Update`,
    message: notifMessage,
    type: 'system',
    link: '/student/mentorship'
  });

  if (status === 'Scheduled') {
    const student = await User.findById(booking.student).select('name email');
    const studentName = student?.name || 'Student';
    if (student?.email) {
      sendMentorshipScheduledStudentEmail(student.email, studentName, booking).catch(() => {});
    }
    const adminEmails = await getMentorshipAdminEmails();
    adminEmails.forEach((email) => {
      sendMentorshipScheduledAdminEmail(email, studentName, booking).catch(() => {});
    });
    await notifyAdminsAboutMentorship(
      `${sessionLabel} Scheduled`,
      `${studentName}'s session for "${booking.subject}" is scheduled on ${new Date(booking.preferredDate).toLocaleDateString('en-IN')} at ${booking.preferredTimeSlot}.`
    );
  }

  res.json(booking);
});

export const deleteMentorshipBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const booking = await MentorshipBooking.findById(id);
  if (!booking) {
    res.status(404);
    throw new Error('1:1 session booking not found');
  }
  await booking.deleteOne();
  res.json({ success: true, message: '1:1 session booking deleted successfully' });
});

export const submitMentorshipFeedback = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    const hasAccess = await checkInfinityAccess(req.user._id);
    if (!hasAccess) {
      res.status(403);
      throw new Error('Access denied. 1:1 Session is exclusively available for Infinity plan subscribers.');
    }
  }
  const { id } = req.params;
  const { rating, studentFeedback } = req.body;

  if (rating === undefined) {
    res.status(400);
    throw new Error('Rating is required');
  }

  const booking = await MentorshipBooking.findOne({ _id: id, student: req.user._id });
  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  booking.rating = rating;
  booking.studentFeedback = studentFeedback || '';
  await booking.save();

  res.json(booking);
});

export const getMentorshipSettings = asyncHandler(async (req, res) => {
  const { courseId, category } = req.query;
  const settings = await getEffectiveMentorshipSettings({ courseId, category });
  res.json(settings);
});

export const getAllMentorshipSettings = asyncHandler(async (req, res) => {
  await MentorshipSetting.findOneAndUpdate(
    { targetType: 'global', targetId: 'global' },
    { $setOnInsert: DEFAULT_MENTORSHIP_SETTINGS },
    { upsert: true, new: true }
  );
  const list = await MentorshipSetting.find().sort({ targetType: 1, targetId: 1 });
  res.json(list);
});

export const updateMentorshipSettings = asyncHandler(async (req, res) => {
  const {
    targetType,
    targetId,
    enabled,
    availableDates,
    availableSlots,
    mentorshipMonthlyLimit,
    doubtMonthlyLimit,
    doubtWeeklyLimit,
  } = req.body;
  if (!targetType || !targetId) {
    res.status(400);
    throw new Error('targetType and targetId are required');
  }

  let settings = await MentorshipSetting.findOne({ targetType, targetId });
  if (!settings) {
    settings = new MentorshipSetting({ targetType, targetId });
  }

  if (enabled !== undefined) settings.enabled = !!enabled;
  if (availableDates !== undefined) settings.availableDates = availableDates;
  if (availableSlots !== undefined) settings.availableSlots = availableSlots;
  if (mentorshipMonthlyLimit !== undefined) {
    settings.mentorshipMonthlyLimit = sanitizeLimit(mentorshipMonthlyLimit, DEFAULT_MENTORSHIP_SETTINGS.mentorshipMonthlyLimit);
  }
  if (doubtMonthlyLimit !== undefined) {
    settings.doubtMonthlyLimit = sanitizeLimit(doubtMonthlyLimit, DEFAULT_MENTORSHIP_SETTINGS.doubtMonthlyLimit);
  }
  if (doubtWeeklyLimit !== undefined) {
    settings.doubtWeeklyLimit = sanitizeLimit(doubtWeeklyLimit, DEFAULT_MENTORSHIP_SETTINGS.doubtWeeklyLimit);
  }

  await settings.save();
  res.json(settings);
});

export const deleteMentorshipSettings = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await MentorshipSetting.findByIdAndDelete(id);
  res.json({ ok: true });
});
