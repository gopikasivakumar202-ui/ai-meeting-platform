/**
 * webrtc.js  (updated – Week 2/3 bridge)
 *
 * Changes from original:
 *  - Added real-time chat relay (send-message event)
 *    so MeetingRoomPage's Socket.io chat actually works.
 *  - send-message persists a Message document and broadcasts
 *    new-message to all participants in the room.
 *
 * Replace Zidio/server/Sockets/webrtc.js with this file.
 */

const Message = require('../models/Message');

module.exports = function setupWebRTC(io, redisClient) {

  io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);

    // ── Join meeting room ─────────────────────────────────────────────────────
    socket.on('join-room', async ({ meetingCode, userId, displayName }) => {
      socket.join(meetingCode);
      socket.data.userId      = userId;
      socket.data.displayName = displayName;
      socket.data.meetingCode = meetingCode;

      // Cache participant in Redis
      await redisClient.sAdd(`room:${meetingCode}:participants`, userId);
      await redisClient.expire(`room:${meetingCode}:participants`, 3600);

      // Tell others someone joined
      socket.to(meetingCode).emit('user-joined', { userId, displayName });

      // Send current participant list to the joining user
      const participants = await redisClient.sMembers(`room:${meetingCode}:participants`);
      socket.emit('room:state', { meetingCode, participants });

      console.log(`✅ ${displayName} joined room ${meetingCode}`);
    });

    // ── Leave room ────────────────────────────────────────────────────────────
    socket.on('leave-room', async ({ meetingCode, userId }) => {
      socket.leave(meetingCode);
      await redisClient.sRem(`room:${meetingCode}:participants`, userId);
      io.to(meetingCode).emit('user-left', { userId });
    });

    // ── WebRTC signaling ──────────────────────────────────────────────────────
    socket.on('offer', ({ meetingCode, offer, to }) => {
      io.to(to).emit('offer', { offer, from: socket.id });
    });

    socket.on('answer', ({ to, answer }) => {
      io.to(to).emit('answer', { answer, from: socket.id });
    });

    socket.on('ice-candidate', ({ to, candidate }) => {
      io.to(to).emit('ice-candidate', { candidate, from: socket.id });
    });

    // ── Real-time chat (Week 2/3 bridge) ──────────────────────────────────────
    socket.on('send-message', async ({ roomId, content }) => {
      if (!content?.trim()) return;

      const senderName = socket.data.displayName || 'Anonymous';

      // Persist to MongoDB (Message model already exists in codebase)
      try {
        await Message.create({
          room:    roomId,
          sender:  socket.data.userId || socket.id,
          content: content.trim(),
        });
      } catch (err) {
        console.error('Chat persist error:', err.message);
      }

      // Broadcast to everyone in the room (including sender)
      io.to(roomId).emit('new-message', {
        sender:    senderName,
        content:   content.trim(),
        timestamp: new Date(),
      });
    });

    // ── Typing indicators ──────────────────────────────────────────────────────
    socket.on('typing-start', ({ roomId }) => {
      socket.to(roomId).emit('user-typing', { user: socket.data.displayName });
    });

    socket.on('typing-stop', ({ roomId }) => {
      socket.to(roomId).emit('user-stopped-typing', { user: socket.data.displayName });
    });

    // ── Auto-cleanup on disconnect ─────────────────────────────────────────────
    socket.on('disconnecting', async () => {
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
