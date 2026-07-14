import asyncHandler from 'express-async-handler';
import LiveClass from '../models/LiveClass.js';
import Enrollment from '../models/Enrollment.js';
import MentorshipBooking from '../models/MentorshipBooking.js';
import { generateAgoraToken, startCloudRecording, stopCloudRecording, queryCloudRecording } from '../services/agora.js';

// UID used for the cloud recorder — must not conflict with real user UIDs
const RECORDER_UID = 999999;

/**
 * POST /api/live/:id/recording/start
 * Admin only — starts Agora Cloud Recording for a live class.
 */
export const startRecording = asyncHandler(async (req, res) => {
  const lc = await LiveClass.findById(req.params.id);
  if (!lc) { res.status(404); throw new Error('Live class not found'); }

  if (lc.recordingStatus === 'recording') {
    res.status(400); throw new Error('Recording is already in progress');
  }

  if (!['agora_call', 'agora_stream', 'agora_interactive', 'agora_broadcast'].includes(lc.platform)) {
    res.status(400); throw new Error('Cloud recording is only supported for Agora-based live classes');
  }

  const channelName = lc.roomId || lc._id.toString();
  const { token } = generateAgoraToken(channelName, RECORDER_UID, 'publisher');

  try {
    const { resourceId, sid } = await startCloudRecording(channelName, token, RECORDER_UID);

    lc.recordingResourceId = resourceId;
    lc.recordingSid = sid;
    lc.recordingStatus = 'recording';
    lc.recordingStartedAt = new Date();
    await lc.save();

    res.json({ success: true, message: 'Cloud recording started successfully', resourceId, sid });
  } catch (err) {
    res.status(500);
    throw new Error(`Failed to start recording: ${err.message}`);
  }
});

/**
 * POST /api/live/:id/recording/stop
 * Admin only — stops Agora Cloud Recording and saves the file URL.
 */
export const stopRecording = asyncHandler(async (req, res) => {
  const lc = await LiveClass.findById(req.params.id);
  if (!lc) { res.status(404); throw new Error('Live class not found'); }

  if (lc.recordingStatus !== 'recording') {
    res.status(400); throw new Error('No active recording to stop');
  }

  if (!lc.recordingResourceId || !lc.recordingSid) {
    res.status(400); throw new Error('Recording IDs missing — cannot stop');
  }

  const channelName = lc.roomId || lc._id.toString();

  try {
    const serverResponse = await stopCloudRecording(
      channelName, lc.recordingResourceId, lc.recordingSid, RECORDER_UID
    );

    lc.recordingStatus = 'stopped';
    lc.recordingStoppedAt = new Date();

    const fileList = serverResponse.fileList || [];
    if (fileList.length > 0) {
      const bucket = process.env.AGORA_S3_BUCKET || '';
      const region = process.env.AGORA_S3_REGION || 'ap-south-1';
      const mp4File = fileList.find(f => f.fileName?.endsWith('.mp4')) || fileList[0];
      if (mp4File?.fileName) {
        lc.recordingUrl = `https://${bucket}.s3.${region}.amazonaws.com/${mp4File.fileName}`;
      }
    }

    await lc.save();
    res.json({ success: true, message: 'Recording stopped', recordingUrl: lc.recordingUrl, fileList });
  } catch (err) {
    lc.recordingStatus = 'stopped';
    await lc.save();
    res.status(500);
    throw new Error(`Failed to stop recording cleanly: ${err.message}`);
  }
});

/**
 * GET /api/live/:id/recording/status
 * Admin or enrolled student — get recording status and URL.
 */
export const getRecordingStatus = asyncHandler(async (req, res) => {
  const lc = await LiveClass.findById(req.params.id);
  if (!lc) { res.status(404); throw new Error('Live class not found'); }

  const isAdmin = req.user.role === 'admin';

  if (!isAdmin) {
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
    if (allowedStudentIds.length > 0) {
      if (!allowedStudentIds.includes(req.user._id.toString())) {
        res.status(403);
        throw new Error('This 1:1 session is assigned to another student');
      }
    } else {
      const courseIds = [];
      if (lc.course) courseIds.push(lc.course);
      if (lc.courses?.length) lc.courses.forEach(c => courseIds.push(c._id || c));
      if (courseIds.length > 0) {
        const enrolled = await Enrollment.exists({ student: req.user._id, course: { $in: courseIds } });
        if (!enrolled) { res.status(403); throw new Error('Not enrolled in this course'); }
      }
    }
  }

  let liveStatus = null;
  if (isAdmin && lc.recordingStatus === 'recording' && lc.recordingResourceId && lc.recordingSid) {
    try {
      liveStatus = await queryCloudRecording(lc.recordingResourceId, lc.recordingSid);
    } catch (_) {}
  }

  res.json({
    recordingStatus: lc.recordingStatus,
    recordingUrl: lc.recordingUrl,
    recordingStartedAt: lc.recordingStartedAt,
    recordingStoppedAt: lc.recordingStoppedAt,
    liveStatus: isAdmin ? liveStatus : undefined,
  });
});

/**
 * GET /api/admin/live-classes/conducted
 * Admin only — list classes that were actually conducted (status=ended or startedAt set).
 */
export const getConductedClasses = asyncHandler(async (req, res) => {
  const { from, to } = req.query;

  const query = {
    $or: [
      { status: 'ended' },
      { startedAt: { $ne: null } },
    ],
  };

  if (from || to) {
    query.scheduledAt = {};
    if (from) query.scheduledAt.$gte = new Date(from);
    if (to) query.scheduledAt.$lte = new Date(to);
  }

  const classes = await LiveClass.find(query)
    .populate('course', 'title category')
    .populate('courses', 'title category')
    .sort({ scheduledAt: -1 })
    .limit(200);

  res.json({
    total: classes.length,
    classes: classes.map(lc => ({
      _id: lc._id,
      title: lc.title,
      instructor: lc.instructor,
      platform: lc.platform,
      scheduledAt: lc.scheduledAt,
      startedAt: lc.startedAt,
      endedAt: lc.endedAt,
      durationMins: lc.durationMins,
      status: lc.status,
      courses: lc.courses,
      course: lc.course,
      recordingStatus: lc.recordingStatus,
      recordingUrl: lc.recordingUrl,
    })),
  });
});
