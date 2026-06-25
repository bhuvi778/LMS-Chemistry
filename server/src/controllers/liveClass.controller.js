import asyncHandler from 'express-async-handler';
import LiveClass from '../models/LiveClass.js';
import Enrollment from '../models/Enrollment.js';
import { generateAgoraToken } from '../services/agora.js';

/** GET /api/live/:id — for a logged-in user, returns details if they are enrolled (or admin). */
export const getLiveClass = asyncHandler(async (req, res) => {
  const lc = await LiveClass.findById(req.params.id)
    .populate('course', 'title category')
    .populate('courses', 'title category');
  if (!lc) { res.status(404); throw new Error('Live class not found'); }
  
  const isAdmin = req.user.role === 'admin';

  // Student → must be enrolled in linked course or any linked courses (or no course set)
  if (!isAdmin) {
    const courseIds = [];
    if (lc.course) courseIds.push(lc.course._id || lc.course);
    if (lc.courses && lc.courses.length > 0) {
      lc.courses.forEach((c) => {
        const cid = (c._id || c).toString();
        if (!courseIds.map(x => x.toString()).includes(cid)) {
          courseIds.push(c._id || c);
        }
      });
    }
    if (courseIds.length > 0) {
      const enrolled = await Enrollment.exists({ student: req.user._id, course: { $in: courseIds } });
      if (!enrolled) { res.status(403); throw new Error('You are not enrolled in this course'); }
    }
  }

  const obj = lc.toObject();

  // Generate Agora Token if applicable
  if (['agora_call', 'agora_stream', 'agora_interactive', 'agora_broadcast'].includes(lc.platform)) {
    const channelName = lc.roomId || lc._id.toString();
    const uid = parseInt(req.user._id.toString().slice(-8), 16) || 0;
    
    // Role logic:
    // 'agora_call' & 'agora_interactive' generate publisher tokens so participants can speak/stream.
    // 'agora_broadcast' and legacy 'agora_stream' generate publisher tokens for admins and subscriber tokens for students.
    let agoraRole = 'subscriber';
    if (['agora_call', 'agora_interactive'].includes(lc.platform) || isAdmin) {
      agoraRole = 'publisher';
    }

    const { token, appId } = generateAgoraToken(channelName, uid, agoraRole);
    obj.agoraToken = token;
    obj.agoraAppId = appId;
    obj.agoraUid = uid;
    obj.agoraChannel = channelName;
  }

  // Hide passcode from non-admin
  if (!isAdmin) {
    delete obj.roomPasscode;
  }
  
  res.json(obj);
});
