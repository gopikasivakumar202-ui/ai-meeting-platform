export const registerChatHandlers = (io, socket) => {
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-joined', { user: socket.user, roomId });
  });
  socket.on('send-message', async ({ roomId, content }) => {
    const msg = await Message.create({
      room: roomId, sender: socket.user._id, content
    });
    const populated = await msg.populate('sender', 'name avatar');
    io.to(roomId).emit('new-message', populated);
  });
  socket.on('typing-start', ({ roomId }) => {
    socket.to(roomId).emit('user-typing', { user: socket.user.name });
  });
  socket.on('typing-stop', ({ roomId }) => {
    socket.to(roomId).emit('user-stopped-typing', { user: socket.user.name });
  });
  socket.on('leave-room', (roomId) => {
    socket.leave(roomId);
    socket.to(roomId).emit('user-left', { user: socket.user, roomId });
  });
};