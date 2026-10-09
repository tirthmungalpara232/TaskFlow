const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const User = require('../models/User');

// Called once from server.js after the http server is created.
// Returns the io instance so server.js can attach it to req (req.io) for
// the chat controller to emit from.
module.exports = function initChatSocket(server) {
  const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',');
  const io = new Server(server, {
    cors: { origin: allowedOrigins, credentials: true },
  });

  // Same JWT already issued by /api/auth/login — no separate socket login step
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Not authorized, no token provided'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) return next(new Error('Not authorized, user no longer exists'));

      socket.userId = user._id.toString();
      next();
    } catch (error) {
      next(new Error('Not authorized, token invalid or expired'));
    }
  });

  io.on('connection', (socket) => {
    // Client emits this once a project is selected on ProjectDetails
    socket.on('join-project', (projectId) => {
      socket.join(`project:${projectId}`);
    });

    socket.on('leave-project', (projectId) => {
      socket.leave(`project:${projectId}`);
    });

    // Client emits this when opening a DM thread with a specific member/owner.
    // Room name is identical no matter who opens it first, and a socket can
    // only ever join it as itself — it was JWT-authenticated as socket.userId
    // above, so it can't impersonate the other participant.
    socket.on('join-dm', ({ projectId, otherUserId }) => {
      const pair = [socket.userId, otherUserId].sort().join(':');
      socket.join(`dm:${projectId}:${pair}`);
    });

    socket.on('leave-dm', ({ projectId, otherUserId }) => {
      const pair = [socket.userId, otherUserId].sort().join(':');
      socket.leave(`dm:${projectId}:${pair}`);
    });
  });

  return io;
};
