require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const { createClient } = require('redis');
const RedisStore = require('connect-redis').default;

const authRoutes = require('./routes/authRoutes');
const meetingRoutes = require('./routes/meetingRoutes');
const setupWebRTC = require('./Sockets/webrtc');

const app = express();
const server = http.createServer(app);

// ─── Allowed origins (http AND https for local dev) ───────────────────────────
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'https://localhost:5173',
  'http://localhost:5174',
  'https://localhost:5174',   // ← fixes the CORS error (basicSsl uses https)
  process.env.CLIENT_URL,
].filter(Boolean);

(async () => {

  // ─── REDIS ──────────────────────────────────────────────
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    tls: process.env.REDIS_URL?.startsWith('rediss://'),
    rejectUnauthorized: false
  }
});
  redisClient.on('error', err => console.error('❌ Redis error:', err));
  await redisClient.connect();
  console.log('✅ Redis connected');

  // ─── SESSION WITH REDIS STORE ───────────────────────────
  app.use(session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET || 'intellimeet_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24   // 24 hours
    }
  }));

  // ─── CORS ────────────────────────────────────────────────
  app.use(cors({
    origin: ALLOWED_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  app.use(express.json());

  // ─── RATE LIMITER ────────────────────────────────────────
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'production' ? 10 : 100,
    message: { message: 'Too many attempts, please try again later.' }
  });

  // ─── ROUTES ──────────────────────────────────────────────
  app.use('/api/auth', authLimiter, authRoutes);
  app.use('/api/meetings', meetingRoutes);

  // Pass redisClient to routes via app
  app.set('redisClient', redisClient);

  // ─── SOCKET.IO ───────────────────────────────────────────
  const io = new Server(server, {
    cors: {
      origin: ALLOWED_ORIGINS,   // ← also fixed here for Socket.IO
      methods: ['GET', 'POST'],
      credentials: true,
    }
  });
  setupWebRTC(io, redisClient);

  // ─── MONGODB ─────────────────────────────────────────────
  mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => console.error('❌ MongoDB error:', err));

  // ─── START SERVER ─────────────────────────────────────────
  const PORT = process.env.PORT || 5002;
  server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

})();