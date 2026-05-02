/**
 * webrtc.js  (fixed)
 *
 * Fixes:
 *  1. offer/answer now forward displayName so client can resolve peer names
 *  2. Signaling (offer/answer/ice-candidate) now routes by userId via
 *     a userSocketMap — previously used socket.id as the "to" target
 *     but the client sends userId, causing messages to never arrive.
 *  3. ice-candidate routing fixed the same way.
 */

const Message = require('../models/Message');

module.exports = function setupWebRTC(io, redisClient) {

  // ✅ FIX 1: Map userId → socket.id so we can route by userId
  const userSocketMap = new Map(); // userId -> socket.id

  io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);

    // ── Join meeting room ─────────────────────────────────────────────────────
    socket.on('join-room', async ({ meetingCode, userId, displayName }) => {
      socket.join(meetingCode);
      socket.data.userId      = userId;
      socket.data.displayName = displayName;
      socket.data.meetingCode = meetingCode;

      // ✅ FIX 2: Register userId -> socket.id mapping
      userSocketMap.set(userId, socket.id);

      // Cache participant in Redis
      await redisClient.sAdd(`room:${meetingCode}:participants`, userId);
      await redisClient.expire(`room:${meetingCode}:participants`, 3600);

      // Tell others someone joined (with displayName)
      socket.to(meetingCode).emit('user-joined', { userId, displayName });

      // Send current participant list to the joining user
      const participants = await redisClient.sMembers(`room:${meetingCode}:participants`);
      socket.emit('room:state', { meetingCode, participants });

      console.log(`✅ ${displayName} (${userId}) joined room ${meetingCode}`);
    });

    // ── Leave room ────────────────────────────────────────────────────────────
    socket.on('leave-room', async ({ meetingCode, userId }) => {
      socket.leave(meetingCode);
      userSocketMap.delete(userId);
      await redisClient.sRem(`room:${meetingCode}:participants`, userId);
      io.to(meetingCode).emit('user-left', { userId });
    });

    // ── WebRTC signaling ──────────────────────────────────────────────────────

    // ✅ FIX 3: Route offer by userId (not socket.id), forward displayName
    socket.on('offer', ({ meetingCode, offer, to, displayName }) => {
      const targetSocketId = userSocketMap.get(to);
      if (!targetSocketId) {
        console.warn(`⚠️ offer: no socket found for userId ${to}`);
        return;
      }
      io.to(targetSocketId).emit('offer', {
        offer,
        from:        socket.data.userId || socket.id,
        displayName: socket.data.displayName || displayName || 'Unknown',
      });
    });

    // ✅ FIX 4: Route answer by userId, forward displayName
    socket.on('answer', ({ to, answer, displayName }) => {
      const targetSocketId = userSocketMap.get(to);
      if (!targetSocketId) {
        console.warn(`⚠️ answer: no socket found for userId ${to}`);
        return;
      }
      io.to(targetSocketId).emit('answer', {
        answer,
        from:        socket.data.userId || socket.id,
        displayName: socket.data.displayName || displayName || 'Unknown',
      });
    });

    // ✅ FIX 5: Route ice-candidate by userId
    socket.on('ice-candidate', ({ to, candidate }) => {
      const targetSocketId = userSocketMap.get(to);
      if (!targetSocketId) {
        console.warn(`⚠️ ice-candidate: no socket found for userId ${to}`);
        return;
      }
      io.to(targetSocketId).emit('ice-candidate', {
        candidate,
        from: socket.data.userId || socket.id,
      });
    });

    // ── Real-time chat ────────────────────────────────────────────────────────
    socket.on('send-message', async ({ roomId, content }) => {
      if (!content?.trim()) return;

      const senderName = socket.data.displayName || 'Anonymous';

      try {
        await Message.create({
          room:    roomId,
          sender:  socket.data.userId || socket.id,
          content: content.trim(),
        });
      } catch (err) {
        console.error('Chat persist error:', err.message);
      }

      io.to(roomId).emit('new-message', {
        sender:    senderName,
        content:   content.trim(),
        timestamp: new Date(),
      });
    });

    // ── Typing indicators ─────────────────────────────────────────────────────
    socket.on('typing-start', ({ roomId }) => {
      socket.to(roomId).emit('user-typing', { user: socket.data.displayName });
    });

    socket.on('typing-stop', ({ roomId }) => {
      socket.to(roomId).emit('user-stopped-typing', { user: socket.data.displayName });
    });

    // ── Auto-cleanup on disconnect ────────────────────────────────────────────
    socket.on('disconnecting', async () => {
      // Remove from userSocketMap
      if (socket.data.userId) {
        userSocketMap.delete(socket.data.userId);
      }

      for (const room of socket.rooms) {
        if (room === socket.id) continue;
        await redisClient.sRem(`room:${room}:participants`, socket.data.userId || socket.id);
        socket.to(room).emit('user-left', { userId: socket.data.userId || socket.id });
      }
    });

    socket.on('disconnect', () => {
      console.log('🔌 Client disconnected:', socket.id);
    });
  });
};
