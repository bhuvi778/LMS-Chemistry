import asyncHandler from 'express-async-handler';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import PowerCourseProgress from '../models/PowerCourseProgress.js';

const startOfDay = (value) => {
  const date = value ? new Date(value) : new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const getRequiredTasks = (dayConfig = {}) => {
  const tasks = [];
  if (dayConfig.videoUrl) tasks.push('video');
  if (dayConfig.notesUrl) tasks.push('notes');
  if (dayConfig.quizId) tasks.push('quiz');
  if (dayConfig.liveClassId) tasks.push('live');
  if (dayConfig.assignmentUrl) tasks.push('assignment');
  return tasks;
};

const getTaskSummary = (dayConfig = {}, completedTasks = []) => ([
  { type: 'video', title: dayConfig.videoTitle || 'Watch Lecture Video', enabled: !!dayConfig.videoUrl },
  { type: 'notes', title: dayConfig.notesTitle || 'Read Class Notes', enabled: !!dayConfig.notesUrl },
  { type: 'quiz', title: dayConfig.quizTitle || 'Attempt Quiz', enabled: !!dayConfig.quizId },
  { type: 'live', title: dayConfig.liveClassTitle || 'Attend Live Class', enabled: !!dayConfig.liveClassId },
  { type: 'assignment', title: dayConfig.assignmentTitle || 'Daily Assignment', enabled: !!dayConfig.assignmentUrl },
])
  .filter((task) => task.enabled)
  .map((task) => ({ ...task, completed: completedTasks.includes(task.type) }));

// Dashboard-only daily targets. Plans loop forever: day 16 of a 15-day plan becomes day 1 again.
export const getDashboardDailyTargets = asyncHandler(async (req, res) => {
  const today = startOfDay();
  const enrollments = await Enrollment.find({
    student: req.user._id,
    paymentStatus: 'paid',
  })
    .populate('course')
    .sort({ createdAt: -1 });

  const powerEnrollments = enrollments.filter((enrollment) => enrollment.course?.isPowerCourse);
  if (powerEnrollments.length === 0) {
    return res.json([]);
  }

  const progresses = await PowerCourseProgress.find({
    student: req.user._id,
    course: { $in: powerEnrollments.map((enrollment) => enrollment.course._id) },
  });
  const progressMap = new Map(progresses.map((progress) => [progress.course.toString(), progress]));

  const targets = powerEnrollments.map((enrollment) => {
    const course = enrollment.course;
    const configuredPlan = (course.dailyPlan || [])
      .filter((day) => day?.dayNumber)
      .sort((a, b) => a.dayNumber - b.dayNumber);
    const cycleLength = configuredPlan.length || course.powerCourseDuration || 1;
    const cycleStart = startOfDay(course.startDate || enrollment.createdAt);
    const elapsedDays = Math.max(0, Math.floor((today - cycleStart) / (24 * 60 * 60 * 1000)));
    const cycleDayNumber = (elapsedDays % cycleLength) + 1;
    const cycleNumber = Math.floor(elapsedDays / cycleLength) + 1;
    const dayConfig = configuredPlan.find((day) => day.dayNumber === cycleDayNumber) || {
      dayNumber: cycleDayNumber,
      title: `Day ${cycleDayNumber} Target`,
      description: '',
      topicsCovered: [],
      durationText: '60 min',
    };
    const progress = progressMap.get(course._id.toString());
    const dayProgress = cycleNumber === 1
      ? (progress?.dayProgress || []).find((day) => day.dayNumber === cycleDayNumber)
      : null;
    const completedTasks = dayProgress?.tasksCompleted || [];
    const requiredTasks = getRequiredTasks(dayConfig);
    const completedRequiredCount = requiredTasks.filter((task) => completedTasks.includes(task)).length;

    return {
      courseId: course._id,
      courseTitle: course.title,
      courseThumbnail: course.thumbnail,
      powerCourseType: course.powerCourseType,
      cycleLength,
      cycleDayNumber,
      cycleNumber,
      title: dayConfig.title,
      description: dayConfig.description || '',
      durationText: dayConfig.durationText || '60 min',
      topicsCovered: dayConfig.topicsCovered || [],
      tasks: getTaskSummary(dayConfig, completedTasks),
      requiredTaskCount: requiredTasks.length,
      completedTaskCount: completedRequiredCount,
      isCompleted: requiredTasks.length > 0 && completedRequiredCount === requiredTasks.length,
    };
  });

  res.json(targets);
});

// Get or initialize student progress for a Power Course
export const getStudentProgress = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const studentId = req.user._id;

  // Check enrollment
  const enrolled = await Enrollment.findOne({ student: studentId, course: courseId });
  if (!enrolled) {
    res.status(403);
    throw new Error('You are not enrolled in this course.');
  }

  // Find or create progress
  let progress = await PowerCourseProgress.findOne({ student: studentId, course: courseId });
  if (!progress) {
    progress = await PowerCourseProgress.create({
      student: studentId,
      course: courseId,
      completedDays: [],
      dayProgress: []
    });
  }

  res.json(progress);
});

// Complete a specific task for a day in a Power Course
export const completeStudentTask = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const { dayNumber, taskType, quizScore, quizQuestionsScore, assignmentSubmission } = req.body;
  const studentId = req.user._id;

  if (!dayNumber || !taskType) {
    res.status(400);
    throw new Error('dayNumber and taskType are required.');
  }

  // Verify enrollment
  const enrolled = await Enrollment.findOne({ student: studentId, course: courseId });
  if (!enrolled) {
    res.status(403);
    throw new Error('You are not enrolled in this course.');
  }

  // Fetch course to check dailyPlan configuration
  const course = await Course.findById(courseId);
  if (!course) {
    res.status(404);
    throw new Error('Course not found.');
  }

  const dayConfig = course.dailyPlan.find((d) => d.dayNumber === Number(dayNumber));
  if (!dayConfig) {
    res.status(404);
    throw new Error(`Day ${dayNumber} configuration not found in course daily plan.`);
  }

  // Get or initialize progress
  let progress = await PowerCourseProgress.findOne({ student: studentId, course: courseId });
  if (!progress) {
    progress = await PowerCourseProgress.create({
      student: studentId,
      course: courseId,
      completedDays: [],
      dayProgress: []
    });
  }

  // Get or create day progress item
  let dayProg = progress.dayProgress.find((d) => d.dayNumber === Number(dayNumber));
  if (!dayProg) {
    dayProg = {
      dayNumber: Number(dayNumber),
      tasksCompleted: [],
      quizScore: 0,
      quizQuestionsScore: '',
      assignmentSubmission: ''
    };
    progress.dayProgress.push(dayProg);
    dayProg = progress.dayProgress.find((d) => d.dayNumber === Number(dayNumber));
  }

  // Append task if not already completed
  if (!dayProg.tasksCompleted.includes(taskType)) {
    dayProg.tasksCompleted.push(taskType);
  }

  // Set optional details
  if (taskType === 'quiz') {
    if (quizScore !== undefined) dayProg.quizScore = Number(quizScore);
    if (quizQuestionsScore !== undefined) dayProg.quizQuestionsScore = String(quizQuestionsScore);
  }
  if (taskType === 'assignment') {
    if (assignmentSubmission !== undefined) dayProg.assignmentSubmission = String(assignmentSubmission);
    dayProg.submittedAt = new Date();
  }

  // Determine what tasks are actually required for this day
  const requiredTasks = getRequiredTasks(dayConfig);

  // Check if day is complete
  const isDayComplete = requiredTasks.every((task) => dayProg.tasksCompleted.includes(task));
  const dayCompletedNow = isDayComplete && !progress.completedDays.includes(Number(dayNumber));
  if (isDayComplete) {
    if (!progress.completedDays.includes(Number(dayNumber))) {
      progress.completedDays.push(Number(dayNumber));
    }
  }

  // Save changes
  progress.markModified('dayProgress');
  await progress.save();

  // Sync overall progress percentage with Enrollment model
  const totalDays = course.powerCourseDuration || 7;
  const progressPercent = Math.min(
    100,
    Math.round((progress.completedDays.length / totalDays) * 100)
  );
  
  enrolled.progress = progressPercent;
  await enrolled.save();

  res.json({ progress, progressPercent, dayCompletedNow });
});
