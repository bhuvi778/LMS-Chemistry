import asyncHandler from 'express-async-handler';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import PowerCourseProgress from '../models/PowerCourseProgress.js';

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
  const requiredTasks = [];
  if (dayConfig.videoUrl) requiredTasks.push('video');
  if (dayConfig.notesUrl) requiredTasks.push('notes');
  if (dayConfig.quizId) requiredTasks.push('quiz');
  if (dayConfig.assignmentUrl) requiredTasks.push('assignment');

  // Check if day is complete
  const isDayComplete = requiredTasks.every((task) => dayProg.tasksCompleted.includes(task));
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

  res.json({ progress, progressPercent });
});
