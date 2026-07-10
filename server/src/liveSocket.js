import { Server as IOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import LiveClass from './models/LiveClass.js';
import User from './models/User.js';
import Enrollment from './models/Enrollment.js';
import ChatMessage from './models/ChatMessage.js';

/**
 * Mesh-style WebRTC signaling.
 * Roles:
 *  - host: the admin/instructor that broadcasts
 *  - viewer: a student that receives streams
 *
 * Events from client:
 *  - join { roomId, role }
 *  - signal { to, data } (offer/answer/ICE candidate)
 *  - end (host only)
 *
 * Events emitted to clients:
 *  - peer-joined { peerId, role, name }
 *  - peer-left { peerId }
 *  - peers { list }              (snapshot when joining)
 *  - signal { from, data }
 *  - host-ended
 *  - chat { from, name, text, ts }
 */

export function attachLiveSocket(server) {
  const io = new IOServer(server, {
    cors: { origin: process.env.CLIENT_URL || '*' },
    path: '/socket.io',
  });

  // Auth middleware via JWT in handshake auth.token
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('No token'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
      const user = await User.findById(decoded.id).select('name role _id');
      if (!user) return next(new Error('User not found'));
      socket.user = { _id: String(user._id), name: user.name, role: user.role };
      next();
    } catch (e) {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    let currentRoom = null;

    if (socket.user && socket.user.role === 'admin') {
      socket.join('admins');
    }

    socket.on('join', async ({ liveClassId, role, passcode, agoraUid }, ack) => {
      try {
        const lc = await LiveClass.findById(liveClassId);
        if (!lc || !lc.useInternalRoom) {
          return ack?.({ error: 'Room not found' });
        }
        if (lc.roomPasscode && passcode !== lc.roomPasscode && socket.user.role !== 'admin') {
          return ack?.({ error: 'Invalid passcode' });
        }
        // Enrollment check for non-admin viewers
        if (socket.user.role !== 'admin' && lc.course) {
          const enrolled = await Enrollment.exists({ student: socket.user._id, course: lc.course });
          if (!enrolled) return ack?.({ error: 'You are not enrolled in this course' });
        }
        // Only admins can be host
        const finalRole = role === 'host' && socket.user.role === 'admin' ? 'host' : 'viewer';

        currentRoom = `live:${liveClassId}`;
        socket.join(currentRoom);
        socket.data.role = finalRole;
        socket.data.liveClassId = liveClassId;
        socket.data.name = socket.user.name;
        socket.data.agoraUid = agoraUid;

        // Tell the new user about existing peers
        const existing = [];
        const room = io.sockets.adapter.rooms.get(currentRoom) || new Set();
        for (const sid of room) {
          if (sid === socket.id) continue;
          const s = io.sockets.sockets.get(sid);
          if (s) existing.push({ peerId: sid, role: s.data.role, name: s.data.name, agoraUid: s.data.agoraUid });
        }
        socket.emit('peers', { list: existing });

        // Notify others
        socket.to(currentRoom).emit('peer-joined', {
          peerId: socket.id,
          role: finalRole,
          name: socket.user.name,
          agoraUid: socket.data.agoraUid,
        });

        // If host, mark live class started
        if (finalRole === 'host' && lc.status === 'scheduled') {
          lc.status = 'live';
          lc.startedAt = new Date();
          await lc.save();
        }
        ack?.({ ok: true, role: finalRole, peerId: socket.id });
      } catch (e) {
        ack?.({ error: e.message });
      }
    });

    socket.on('signal', ({ to, data }) => {
      if (!to) return;
      io.to(to).emit('signal', { from: socket.id, data });
    });

    socket.on('raise-hand', () => {
      if (!currentRoom) return;
      io.to(currentRoom).emit('raise-hand', { peerId: socket.id, name: socket.user.name });
    });

    socket.on('lower-hand', ({ peerId }) => {
      if (!currentRoom) return;
      const targetId = peerId || socket.id;
      io.to(currentRoom).emit('lower-hand', { peerId: targetId });
    });

    socket.on('approve-hand', ({ peerId }) => {
      if (!currentRoom || socket.data.role !== 'host') return;
      io.to(currentRoom).emit('approve-hand', { peerId });
    });

    socket.on('remove-cohost', ({ peerId }) => {
      if (!currentRoom || socket.data.role !== 'host') return;
      io.to(currentRoom).emit('remove-cohost', { peerId });
    });

    socket.on('chat', ({ text }) => {
      if (!currentRoom || !text) return;
      io.to(currentRoom).emit('chat', {
        from: socket.id,
        name: socket.user.name,
        text: String(text).slice(0, 500),
        ts: Date.now(),
      });
    });

    // --- Support Chat Handlers ---
    socket.on('chat:join', ({ studentId }, ack) => {
      if (!studentId) return ack?.({ error: 'studentId is required' });
      // Student can only join their own room, Admins can join any
      const targetId = socket.user.role === 'admin' ? studentId : socket.user._id;
      const roomName = `chat:${targetId}`;
      socket.join(roomName);
      ack?.({ ok: true, room: roomName });
    });

    socket.on('chat:message', async ({ studentId, text }) => {
      if (!studentId || !text) return;
      const isAdmin = socket.user.role === 'admin';
      const senderId = socket.user._id;
      const senderName = socket.user.name;
      const recipientId = isAdmin ? studentId : null;

      try {
        const msg = await ChatMessage.create({
          sender: senderId,
          senderName,
          recipient: recipientId,
          text: text.trim(),
        });
        const targetRoom = `chat:${studentId}`;
        io.to(targetRoom).emit('chat:message', msg);

        if (!isAdmin) {
          io.to('admins').emit('chat:admin-notification', {
            studentId,
            senderName,
            text: text.trim(),
            msg,
          });
        }
      } catch (err) {
        console.error('[Socket Chat Error]:', err.message);
      }
    });

    socket.on('end', async () => {
      if (!currentRoom || socket.data.role !== 'host') return;
      io.to(currentRoom).emit('host-ended');
      try {
        const lc = await LiveClass.findById(socket.data.liveClassId);
        if (lc) {
          lc.status = 'ended';
          lc.endedAt = new Date();
          await lc.save();
        }
      } catch { /* ignore */ }
    });

    socket.on('disconnect', () => {
      if (currentRoom) {
        socket.to(currentRoom).emit('peer-left', { peerId: socket.id });
        if (socket.data.role === 'host') {
          io.to(currentRoom).emit('host-ended');
        }
      }
    });
  });

  return io;
}
