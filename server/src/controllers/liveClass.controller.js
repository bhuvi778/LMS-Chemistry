import asyncHandler from 'express-async-handler';
import LiveClass from '../models/LiveClass.js';
import Enrollment from '../models/Enrollment.js';

/** GET /api/live/:id — for a logged-in user, returns details if they are enrolled (or admin). */
export const getLiveClass = asyncHandler(async (req, res) => {
  const lc = await LiveClass.findById(req.params.id).populate('course', 'title category');
  if (!lc) { res.status(404); throw new Error('Live class not found'); }
  // Admin → return everything
  if (req.user.role === 'admin') return res.json(lc);
  // Student → must be enrolled in linked course (or no course set)
  if (lc.course) {
    const enrolled = await Enrollment.exists({ student: req.user._id, course: lc.course._id });
    if (!enrolled) { res.status(403); throw new Error('You are not enrolled in this course'); }
  }
  // Hide passcode from non-admin
  const obj = lc.toObject();
  delete obj.roomPasscode;
  res.json(obj);
});
