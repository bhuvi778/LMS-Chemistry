import asyncHandler from 'express-async-handler';
import LiveClass from '../models/LiveClass.js';
import Enrollment from '../models/Enrollment.js';
import MentorshipBooking from '../models/MentorshipBooking.js';
import { generateAgoraToken } from '../services/agora.js';

/** GET /api/live/:id — for a logged-in user, returns details if they are enrolled (or admin). */
export const getLiveClass = asyncHandler(async (req, res) => {
  const lc = await LiveClass.findById(req.params.id)
    .populate('course', 'title category')
    .populate('courses', 'title category');
  if (!lc) { res.status(404); throw new Error('Live class not found'); }
  
  const isAdmin = req.user.role === 'admin';

  let allowedStudentIds = (lc.allowedStudents || []).map((studentId) => studentId.toString());
  if (allowedStudentIds.length === 0) {
    const mentorshipBooking = await MentorshipBooking.findOne({ liveClass: lc._id }).select('student');
    if (mentorshipBooking?.student) {
      allowedStudentIds = [mentorshipBooking.student.toString()];
      lc.allowedStudents = [mentorshipBooking.student];
      lc.sourceType = 'mentorship';
      lc.sourceRef = mentorshipBooking._id;
      lc.sourceModel = 'MentorshipBooking';
      await lc.save();
    }
  }
  const hasPrivateAudience = allowedStudentIds.length > 0;

  // Student → private 1:1 classes require explicit audience access. Normal
  // classes require enrollment in the linked course(s), or no course for open classes.
  if (!isAdmin) {
    if (hasPrivateAudience) {
      if (!allowedStudentIds.includes(req.user._id.toString())) {
        res.status(403);
        throw new Error('This 1:1 session is assigned to another student');
      }
    } else {
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

    const { token, appId, fallbackMode } = generateAgoraToken(channelName, uid, agoraRole);
    obj.agoraToken = token;
    obj.agoraAppId = appId;
    obj.fallbackMode = fallbackMode || '';
    obj.agoraUid = uid;
    obj.agoraChannel = channelName;
  }

  // Hide passcode from non-admin
  if (!isAdmin) {
    delete obj.roomPasscode;
  }
  
  res.json(obj);
});
