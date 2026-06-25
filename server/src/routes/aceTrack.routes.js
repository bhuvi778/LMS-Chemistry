import { Router } from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import {
  getSyllabus,
  createSubject,
  updateSubject,
  deleteSubject,
  createChapter,
  deleteChapter,
  createTopic,
  deleteTopic,
  createSubTopic,
  deleteSubTopic,
  getStudentProgress,
  toggleProgress,
  getPlannerGoals,
  createPlannerGoal,
  togglePlannerGoal,
  deletePlannerGoal,
  requestMentorship,
  getMentorshipBookings,
  updateMentorshipBooking,
  submitMentorshipFeedback,
  getMentorshipSettings,
  getAllMentorshipSettings,
  updateMentorshipSettings,
  deleteMentorshipSettings
} from '../controllers/aceTrack.controller.js';

const router = Router();
router.use(protect);

// Syllabus & Progress Routes
router.get('/syllabus', getSyllabus);
router.get('/progress', getStudentProgress);
router.post('/progress/toggle', toggleProgress);

// Admin-only Syllabus modifications
router.post('/syllabus/subject', adminOnly, createSubject);
router.put('/syllabus/subject/:id', adminOnly, updateSubject);
router.delete('/syllabus/subject/:id', adminOnly, deleteSubject);
router.post('/syllabus/subject/:id/chapter', adminOnly, createChapter);
router.delete('/syllabus/subject/:subjectId/chapter/:chapterId', adminOnly, deleteChapter);
router.post('/syllabus/subject/:subjectId/chapter/:chapterId/topic', adminOnly, createTopic);
router.delete('/syllabus/subject/:subjectId/chapter/:chapterId/topic/:topicId', adminOnly, deleteTopic);
router.post('/syllabus/subject/:subjectId/chapter/:chapterId/topic/:topicId/subtopic', adminOnly, createSubTopic);
router.delete('/syllabus/subject/:subjectId/chapter/:chapterId/topic/:topicId/subtopic/:subtopicId', adminOnly, deleteSubTopic);

// Planner Routes
router.get('/planner', getPlannerGoals);
router.post('/planner', createPlannerGoal);
router.put('/planner/:id/complete', togglePlannerGoal);
router.delete('/planner/:id', deletePlannerGoal);

// Mentorship Routes
router.post('/mentorship', requestMentorship);
router.get('/mentorship', getMentorshipBookings);
router.put('/mentorship/:id', adminOnly, updateMentorshipBooking);
router.put('/mentorship/:id/feedback', submitMentorshipFeedback);
router.get('/mentorship/settings', getMentorshipSettings);
router.get('/mentorship/settings/all', adminOnly, getAllMentorshipSettings);
router.put('/mentorship/settings', adminOnly, updateMentorshipSettings);
router.delete('/mentorship/settings/:id', adminOnly, deleteMentorshipSettings);

export default router;
