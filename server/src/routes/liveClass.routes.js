import { Router } from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import { getLiveClass } from '../controllers/liveClass.controller.js';
import { startRecording, stopRecording, getRecordingStatus } from '../controllers/recording.controller.js';

const router = Router();
router.use(protect);

router.get('/:id', getLiveClass);

// Recording routes
router.get('/:id/recording/status', getRecordingStatus);
router.post('/:id/recording/start', adminOnly, startRecording);
router.post('/:id/recording/stop', adminOnly, stopRecording);

export default router;
