require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const http = require("http");
const { Server } = require("socket.io");
const authRoutes = require("./routes/auth.routes");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "http://localhost:3000", methods: ["GET", "POST"] }
});

app.use(helmet());
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.get("/healthz", (req, res) => res.json({ status: "ok" }));
app.get("/", (req, res) => res.json({ message: "Meeting Platform API running" }));

// Socket.io
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  socket.on("join-room", ({ meetingId }) => {
    socket.join(meetingId);
    socket.to(meetingId).emit("user-joined", { userId: socket.id });
  });
  socket.on("disconnect", () => console.log("User disconnected:", socket.id));
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));