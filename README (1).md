# IntellMeet 🎯

> AI-Powered Enterprise Meeting Platform with real-time video, live chat, and intelligent summaries.

![Status](https://img.shields.io/badge/Status-Week%201%20Complete-brightgreen)
![Node](https://img.shields.io/badge/Node.js-v24-green)
![React](https://img.shields.io/badge/React-18-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)
![Redis](https://img.shields.io/badge/Redis-Cloud-red)

---

## 🚀 Features

- 🔐 **JWT Authentication** — Secure register/login with bcrypt password hashing
- 📋 **Meeting Management** — Create, join, update, delete meetings with auto-generated 8-digit codes
- 🎥 **Real-Time Video** — WebRTC peer-to-peer video calls with mute/camera controls
- ⚡ **Socket.io** — Real-time room events, participant join/leave notifications
- 🗄️ **Redis Caching** — Session store + meeting cache for sub-millisecond reads
- 👤 **Avatar Upload** — Profile picture support via Cloudinary
- 🛡️ **Rate Limiting** — Brute-force protection on auth endpoints

---

## 🏗️ Tech Stack

| Layer       | Technology                        |
|-------------|-----------------------------------|
| Frontend    | React 18 + Vite                   |
| Backend     | Node.js + Express.js              |
| Database    | MongoDB Atlas + Mongoose          |
| Cache       | Redis Cloud (free tier)           |
| Real-time   | Socket.io + WebRTC                |
| Auth        | JWT + bcryptjs                    |
| Storage     | Cloudinary (avatar uploads)       |

---

## 📁 Project Structure

```
Zidio/
├── client/                         # React frontend
│   ├── src/
│   │   └── App.jsx                 # Main app + MeetingRoom + JoinPage
│   ├── App.css
│   ├── index.html
│   └── vite.config.js
│
├── server/                         # Node.js backend
│   ├── controllers/
│   │   ├── authController.js       # Register, login, getMe, uploadAvatar
│   │   └── meetingController.js    # CRUD + joinMeeting
│   ├── middleware/
│   │   └── authMiddleware.js       # JWT protect middleware
│   ├── models/
│   │   ├── User.js                 # User schema
│   │   └── Meeting.js              # Meeting schema + meetingCode pre-save hook
│   ├── routes/
│   │   ├── authRoutes.js           # /api/auth/*
│   │   └── meetingRoutes.js        # /api/meetings/*
│   ├── Sockets/
│   │   └── webrtc.js               # Socket.io + WebRTC signaling
│   ├── server.js                   # Entry point
│   └── .env                        # Environment variables (not committed)
│
└── README.md
```

---

## ⚙️ Environment Variables

Create a `.env` file inside the `server/` folder:

```env
PORT=5002
MONGO_URI=your_mongodb_connection_string
REDIS_URL=redis://default:password@host:port
JWT_SECRET=your_jwt_secret_key
SESSION_SECRET=your_session_secret
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

> ⚠️ Never commit `.env` to GitHub. Add it to `.gitignore`.

---

## 🛠️ Getting Started

### Prerequisites

- Node.js v18+
- MongoDB Atlas account
- Redis Cloud account (free tier)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/intellimeet.git
cd intellimeet
```

### 2. Install server dependencies

```bash
cd server
npm install
```

### 3. Install client dependencies

```bash
cd ../client
npm install
```

### 4. Set up environment variables

```bash
# In server/ folder
cp .env.example .env
# Fill in your MongoDB URI, Redis URL, JWT secret
```

### 5. Start the backend

```bash
cd server
node server.js
```

Expected output:
```
✅ Redis connected
✅ MongoDB connected
🚀 Server running on port 5002
```

### 6. Start the frontend

```bash
cd client
npm run dev
```

### 7. Open in browser

```
http://localhost:5173
```

---

## 📡 API Reference

### Authentication

| Method | Endpoint                    | Description                        | Auth |
|--------|-----------------------------|------------------------------------|------|
| POST   | `/api/auth/register`        | Register new user, returns JWT     | No   |
| POST   | `/api/auth/login`           | Login user, returns JWT            | No   |
| GET    | `/api/auth/me`              | Get current user profile           | Yes  |
| POST   | `/api/auth/upload-avatar`   | Upload profile picture             | Yes  |

### Meetings

| Method | Endpoint                  | Description                          | Auth |
|--------|---------------------------|--------------------------------------|------|
| POST   | `/api/meetings/`          | Create new meeting, generates code   | Yes  |
| POST   | `/api/meetings/join`      | Join meeting by 8-digit code         | Yes  |
| GET    | `/api/meetings/`          | Get all meetings for current user    | Yes  |
| GET    | `/api/meetings/:id`       | Get single meeting by ID             | Yes  |
| PUT    | `/api/meetings/:id`       | Update meeting (host only)           | Yes  |
| DELETE | `/api/meetings/:id`       | Delete meeting (host only)           | Yes  |

### Request/Response Examples

**Register**
```json
POST /api/auth/register
{
  "name": "GopikaSivakumar",
  "email": "gopika@gmail.com",
  "password": "123456"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "name": "GopikaSivakumar"
}
```

**Create Meeting**
```json
POST /api/meetings/
Authorization: Bearer <token>
{
  "title": "Team Standup",
  "description": "Daily sync"
}

Response:
{
  "_id": "661f1a2b3c4d5e6f7a8b9c0d",
  "title": "Team Standup",
  "meetingCode": "PGWCEBCP",
  "status": "scheduled",
  "host": "660abc123def456ghi789jkl",
  "participants": [],
  "createdAt": "2026-04-06T07:00:00.000Z"
}
```

**Join Meeting**
```json
POST /api/meetings/join
Authorization: Bearer <token>
{
  "meetingCode": "PGWCEBCP"
}

Response:
{
  "title": "Team Standup",
  "meetingCode": "PGWCEBCP",
  "status": "scheduled",
  "participants": [{ "user": "...", "joinedAt": "..." }]
}
```

---

## ⚡ Real-Time Events (Socket.io)

### Client → Server

| Event           | Payload                                      | Description                |
|-----------------|----------------------------------------------|----------------------------|
| `join-room`     | `{ meetingCode, userId, displayName }`       | Join a meeting room        |
| `leave-room`    | `{ meetingCode, userId }`                    | Leave a meeting room       |
| `offer`         | `{ meetingCode, offer, to }`                 | WebRTC offer               |
| `answer`        | `{ to, answer }`                             | WebRTC answer              |
| `ice-candidate` | `{ to, candidate }`                          | ICE candidate exchange     |

### Server → Client

| Event           | Payload                                      | Description                |
|-----------------|----------------------------------------------|----------------------------|
| `room:state`    | `{ meetingCode, participants }`              | Current room participants  |
| `user-joined`   | `{ userId, displayName }`                    | New participant joined      |
| `user-left`     | `{ userId }`                                 | Participant left            |
| `offer`         | `{ offer, from }`                            | WebRTC offer received       |
| `answer`        | `{ answer, from }`                           | WebRTC answer received      |
| `ice-candidate` | `{ candidate, from }`                        | ICE candidate received      |

---

## 🗄️ Redis Architecture

```
session:{userId}              →  JWT session data       TTL: 24 hours
meeting:{meetingCode}         →  Cached meeting data    TTL: 1 hour
room:{meetingCode}:participants →  Redis Set of userIds  TTL: 1 hour
```

---

## 📅 Week 1 Checklist

- [x] Day 1 — Project setup, folder structure, dependencies installed
- [x] Day 2 — MongoDB connection, User model, Auth routes (register/login)
- [x] Day 3 — JWT authentication, authMiddleware, protected routes
- [x] Day 4 — Meeting model, CRUD routes, meeting code auto-generation
- [x] Day 5 — Redis Cloud connected, session caching, Socket.io configured
- [x] Day 6 — WebRTC video room, peer connections, mute/camera controls
- [x] Day 7 — README documentation, API reference, Week 1 checkpoint ✅

---

## 🗓️ Week 2 Roadmap

- [ ] Day 8  — Live chat inside meeting room
- [ ] Day 9  — Screen sharing (getDisplayMedia)
- [ ] Day 10 — Participant name labels on video tiles
- [ ] Day 11 — Mobile responsive UI
- [ ] Day 12 — AI summary integration (OpenAI API)
- [ ] Day 13 — Action items auto-extraction
- [ ] Day 14 — Week 2 checkpoint + deployment (Vercel + Render)

---

## ⚠️ Known Limitations (Week 1)

- Screen sharing not yet implemented
- AI summaries not yet connected
- No live chat inside meeting room yet
- Mobile responsiveness in progress
- No recording feature yet

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

MIT © 2026 Zidio Development

---

## 👩‍💻 Author

**GopikaSivakumar** — Zidio Development Internship Project
