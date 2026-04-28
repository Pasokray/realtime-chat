/* ═══════════════════════════════════════════════════
   ChatSphere — client
   ═══════════════════════════════════════════════════ */

const socket = io();

/* ── State ─────────────────────────────────────── */
let myUsername = "";
let myRoom = "General";
let typingTimer = null;
let isTyping = false;
const typingUsers = new Set();

/* ── DOM refs ──────────────────────────────────── */
const joinScreen    = document.getElementById("join-screen");
const app           = document.getElementById("app");
const joinBtn       = document.getElementById("join-btn");
const joinError     = document.getElementById("join-error");
const usernameInput = document.getElementById("username-input");
const roomPicker    = document.getElementById("room-picker");
const msgInput      = document.getElementById("msg-input");
const sendBtn       = document.getElementById("send-btn");
const messagesList  = document.getElementById("messages");
const typingEl      = document.getElementById("typing-indicator");
const typingText    = document.getElementById("typing-text");
const roomListEl    = document.getElementById("room-list");
const userListEl    = document.getElementById("user-list");
const currentRoomNameEl = document.getElementById("current-room-name");
const roomCountEl   = document.getElementById("room-count");
const myAvatarEl    = document.getElementById("my-avatar");
const myUsernameEl  = document.getElementById("my-username");
const menuToggle    = document.getElementById("menu-toggle");
const sidebar       = document.querySelector(".sidebar");
const leaveBtn      = document.getElementById("leave-btn");

/* ── Room picker (join screen) ─────────────────── */
roomPicker.querySelectorAll(".room-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    roomPicker.querySelectorAll(".room-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    myRoom = btn.dataset.room;
  });
});

/* ── Join ──────────────────────────────────────── */
function attemptJoin() {
  const name = usernameInput.value.trim();
  if (!name) { joinError.textContent = "Please enter a username."; return; }
  if (name.length < 2) { joinError.textContent = "Username must be at least 2 characters."; return; }
  myUsername = name;
  socket.emit("join", { username: myUsername, room: myRoom });
}

joinBtn.addEventListener("click", attemptJoin);
usernameInput.addEventListener("keydown", (e) => { if (e.key === "Enter") attemptJoin(); });

/* ── Send message ──────────────────────────────── */
function sendMessage() {
  const text = msgInput.value.trim();
  if (!text) return;
  socket.emit("chatMessage", { text });
  msgInput.value = "";
  stopTyping();
}

sendBtn.addEventListener("click", sendMessage);
msgInput.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) sendMessage(); });

/* ── Typing indicator ──────────────────────────── */
msgInput.addEventListener("input", () => {
  if (!isTyping && msgInput.value) {
    isTyping = true;
    socket.emit("typing", { isTyping: true });
  }
  clearTimeout(typingTimer);
  typingTimer = setTimeout(stopTyping, 1500);
});

function stopTyping() {
  if (isTyping) {
    isTyping = false;
    socket.emit("typing", { isTyping: false });
  }
}

/* ── Mobile menu ───────────────────────────────── */
menuToggle.addEventListener("click", () => sidebar.classList.toggle("open"));
document.addEventListener("click", (e) => {
  if (!sidebar.contains(e.target) && e.target !== menuToggle) {
    sidebar.classList.remove("open");
  }
});

/* ── Leave ─────────────────────────────────────── */
leaveBtn.addEventListener("click", () => {
  if (confirm("Leave the chat?")) location.reload();
});

/* ══════════════════════════════════════════════════
   SOCKET EVENTS
   ══════════════════════════════════════════════════ */

socket.on("connect", () => {
  document.getElementById("conn-badge").style.opacity = "1";
});
socket.on("disconnect", () => {
  document.getElementById("conn-badge").style.opacity = ".4";
});

/* Server confirmed the join — show the app */
socket.on("history", (msgs) => {
  joinScreen.classList.add("hidden");
  app.classList.remove("hidden");
  myAvatarEl.textContent = "😊"; // will be overwritten when we see our own msg
  myUsernameEl.textContent = myUsername;
  currentRoomNameEl.textContent = myRoom;
  messagesList.innerHTML = "";
  msgs.forEach(appendMessage);
  scrollBottom();
  msgInput.focus();
});

socket.on("message", (msg) => {
  appendMessage(msg);
  scrollBottom();
});

socket.on("roomUsers", ({ room, users }) => {
  if (room !== myRoom) return;
  roomCountEl.textContent = `${users.length} online`;
  userListEl.innerHTML = users
    .map((u) => `<li><span class="dot-online"></span>${escHtml(u.username)}</li>`)
    .join("");
});

socket.on("roomList", (rooms) => {
  roomListEl.innerHTML = rooms
    .map(({ name, count }) => `
      <li>
        <button class="${name === myRoom ? "active-room" : ""}" onclick="switchRoom('${escHtml(name)}')">
          <span>${escHtml(name)}</span>
          <span class="room-count-badge">${count}</span>
        </button>
      </li>`)
    .join("");
});

socket.on("roomChanged", (room) => {
  myRoom = room;
  currentRoomNameEl.textContent = room;
  messagesList.innerHTML = "";
  typingUsers.clear();
  updateTypingUI();
});

socket.on("typing", ({ username, isTyping: t }) => {
  if (t) typingUsers.add(username);
  else typingUsers.delete(username);
  updateTypingUI();
});

/* ══════════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════════ */

function appendMessage(msg) {
  const li = document.createElement("li");

  if (msg.type === "system") {
    li.className = "system";
    li.innerHTML = `<span class="system-text">${escHtml(msg.text)}</span>`;
    messagesList.appendChild(li);
    return;
  }

  const isMine = msg.username === myUsername;
  li.className = isMine ? "mine" : "theirs";

  if (isMine && msg.avatar) myAvatarEl.textContent = msg.avatar;

  const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (!isMine) {
    li.innerHTML = `
      <div class="msg-meta">
        <span class="avatar">${msg.avatar || "😊"}</span>
        <span class="uname">${escHtml(msg.username)}</span>
      </div>
      <div class="bubble">${escHtml(msg.text)}</div>
      <span class="ts">${time}</span>`;
  } else {
    li.innerHTML = `
      <div class="bubble">${escHtml(msg.text)}</div>
      <span class="ts">${time}</span>`;
  }

  messagesList.appendChild(li);
}

function updateTypingUI() {
  const others = [...typingUsers].filter((u) => u !== myUsername);
  if (others.length === 0) {
    typingEl.classList.add("hidden");
    return;
  }
  typingEl.classList.remove("hidden");
  typingText.textContent =
    others.length === 1
      ? `${others[0]} is typing…`
      : `${others.slice(0, 2).join(", ")} are typing…`;
}

function scrollBottom() {
  const wrap = document.querySelector(".messages-wrap");
  wrap.scrollTop = wrap.scrollHeight;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* Exposed globally for inline onclick */
function switchRoom(room) {
  if (room === myRoom) return;
  socket.emit("switchRoom", { room });
  sidebar.classList.remove("open");
}
