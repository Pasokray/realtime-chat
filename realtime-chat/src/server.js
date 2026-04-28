const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, "../public")));

// In-memory store
const users = new Map();       // socketId → { username, room, avatar }
const rooms = new Map();       // roomName → Set of socketIds
const roomMessages = new Map(); // roomName → array of last 50 messages

const ROOMS = ["General", "Tech Talk", "Random", "Gaming", "Music"];
ROOMS.forEach((r) => {
  rooms.set(r, new Set());
  roomMessages.set(r, []);
});

function getRoomUsers(room) {
  const ids = rooms.get(room) || new Set();
  return [...ids].map((id) => users.get(id)).filter(Boolean);
}

function saveMessage(room, msg) {
  const msgs = roomMessages.get(room) || [];
  msgs.push(msg);
  if (msgs.length > 50) msgs.shift();
  roomMessages.set(room, msgs);
}

const AVATARS = ["🐺", "🦊", "🐻", "🐼", "🐨", "🦁", "🐯", "🦄", "🐸", "🐙",
  "🦋", "🐬", "🦚", "🦜", "🐧", "🦞", "🐢", "🦎", "🐝", "🌊"];

io.on("connection", (socket) => {
  console.log(`[+] Socket connected: ${socket.id}`);

  // ── Join ──────────────────────────────────────────────────────────────
  socket.on("join", ({ username, room }) => {
    if (!username || !room) return;

    const avatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
    const user = { username, room, avatar, id: socket.id };
    users.set(socket.id, user);

    socket.join(room);
    rooms.get(room)?.add(socket.id);

    // Send chat history
    const history = roomMessages.get(room) || [];
    socket.emit("history", history);

    // Announce join
    const joinMsg = {
      type: "system",
      text: `${username} joined the room`,
      timestamp: Date.now(),
    };
    saveMessage(room, joinMsg);
    io.to(room).emit("message", joinMsg);

    // Update user list for the room
    io.to(room).emit("roomUsers", { room, users: getRoomUsers(room) });

    // Send available rooms with counts
    socket.emit("roomList", ROOMS.map((r) => ({
      name: r,
      count: rooms.get(r)?.size || 0,
    })));

    console.log(`[>] ${username} joined "${room}"`);
  });

  // ── Send message ─────────────────────────────────────────────────────
  socket.on("chatMessage", ({ text }) => {
    const user = users.get(socket.id);
    if (!user || !text?.trim()) return;

    const msg = {
      type: "chat",
      id: `${socket.id}-${Date.now()}`,
      username: user.username,
      avatar: user.avatar,
      text: text.trim().slice(0, 500),
      timestamp: Date.now(),
    };

    saveMessage(user.room, msg);
    io.to(user.room).emit("message", msg);
  });

  // ── Typing indicator ─────────────────────────────────────────────────
  socket.on("typing", ({ isTyping }) => {
    const user = users.get(socket.id);
    if (!user) return;
    socket.to(user.room).emit("typing", { username: user.username, isTyping });
  });

  // ── Switch room ───────────────────────────────────────────────────────
  socket.on("switchRoom", ({ room }) => {
    const user = users.get(socket.id);
    if (!user || !rooms.has(room)) return;

    const oldRoom = user.room;

    // Leave old room
    socket.leave(oldRoom);
    rooms.get(oldRoom)?.delete(socket.id);
    const leaveMsg = {
      type: "system",
      text: `${user.username} left the room`,
      timestamp: Date.now(),
    };
    saveMessage(oldRoom, leaveMsg);
    io.to(oldRoom).emit("message", leaveMsg);
    io.to(oldRoom).emit("roomUsers", { room: oldRoom, users: getRoomUsers(oldRoom) });

    // Join new room
    user.room = room;
    users.set(socket.id, user);
    socket.join(room);
    rooms.get(room)?.add(socket.id);

    const history = roomMessages.get(room) || [];
    socket.emit("history", history);
    socket.emit("roomChanged", room);

    const joinMsg = {
      type: "system",
      text: `${user.username} joined the room`,
      timestamp: Date.now(),
    };
    saveMessage(room, joinMsg);
    io.to(room).emit("message", joinMsg);
    io.to(room).emit("roomUsers", { room, users: getRoomUsers(room) });

    // Refresh room counts for everyone
    const counts = ROOMS.map((r) => ({ name: r, count: rooms.get(r)?.size || 0 }));
    io.emit("roomList", counts);
  });

  // ── Disconnect ────────────────────────────────────────────────────────
  socket.on("disconnect", () => {
    const user = users.get(socket.id);
    if (!user) return;

    rooms.get(user.room)?.delete(socket.id);
    users.delete(socket.id);

    const leaveMsg = {
      type: "system",
      text: `${user.username} left the chat`,
      timestamp: Date.now(),
    };
    saveMessage(user.room, leaveMsg);
    io.to(user.room).emit("message", leaveMsg);
    io.to(user.room).emit("roomUsers", { room: user.room, users: getRoomUsers(user.room) });

    const counts = ROOMS.map((r) => ({ name: r, count: rooms.get(r)?.size || 0 }));
    io.emit("roomList", counts);

    console.log(`[-] ${user.username} disconnected`);
  });
});

server.listen(PORT, () => {
  console.log(`\n🚀  Chat server running → http://localhost:${PORT}\n`);
});
