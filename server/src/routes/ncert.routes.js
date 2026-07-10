import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import {
  getNCERTChapters,
  getNCERTBadges,
  getNCERTQuestions,
  getNTAAbhyasSubjects,
  getNTAAbhyasChapters,
  getNTAAbhyasQuestions,
  saveNCERTProgress
} from '../controllers/ncert.controller.js';

const router = Router();

// Protect all routes
router.use(protect);

router.get('/chapters/:category', getNCERTChapters);
router.get('/badges/:category', getNCERTBadges);
router.get('/questions', getNCERTQuestions);
router.get('/nta-abhyas/subjects', getNTAAbhyasSubjects);
router.get('/nta-abhyas/chapters/:examCategory', getNTAAbhyasChapters);
router.get('/nta-abhyas/questions', getNTAAbhyasQuestions);
router.post('/progress', saveNCERTProgress);

export default router;
