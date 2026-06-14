import asyncHandler from 'express-async-handler';
import LiveClass from '../models/LiveClass.js';
import Enrollment from '../models/Enrollment.js';
import { generateAgoraToken } from '../services/agora.js';

/** GET /api/live/:id — for a logged-in user, returns details if they are enrolled (or admin). */
export const getLiveClass = asyncHandler(async (req, res) => {
  const lc = await LiveClass.findById(req.params.id).populate('course', 'title category');
  if (!lc) { res.status(404); throw new Error('Live class not found'); }
  
  const isAdmin = req.user.role === 'admin';

  // Student → must be enrolled in linked course (or no course set)
  if (!isAdmin && lc.course) {
    const enrolled = await Enrollment.exists({ student: req.user._id, course: lc.course._id });
    if (!enrolled) { res.status(403); throw new Error('You are not enrolled in this course'); }
  }

  const obj = lc.toObject();

  // Generate Agora Token if applicable
  if (['agora_call', 'agora_stream'].includes(lc.platform)) {
    const channelName = lc.roomId;
    const uid = parseInt(req.user._id.toString().slice(-8), 16) || 0;
    
    // Role logic:
    // 'agora_call' allows everyone to publish (video calling)
    // 'agora_stream' allows only admin to publish, students subscribe (interactive live stream)
    let agoraRole = 'subscriber';
    if (lc.platform === 'agora_call' || isAdmin) {
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
