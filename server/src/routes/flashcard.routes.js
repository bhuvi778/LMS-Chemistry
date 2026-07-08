import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { getFlashcards } from '../controllers/flashcard.controller.js';

const router = Router();

router.get('/', protect, getFlashcards);

export default router;
