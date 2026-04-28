# 💬 ChatSphere — Real-time Chat App

A full-stack **real-time chat application** built with **Node.js**, **Express**, and **Socket.io**.

![Node](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-4.x-010101?logo=socket.io)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## ✨ Features

- 🔴 **Real-time messaging** — messages appear instantly for all users via WebSockets
- 🏠 **Multiple chat rooms** — General, Tech Talk, Random, Gaming, Music
- 💬 **Typing indicators** — see when others are typing
- 📜 **Message history** — last 50 messages loaded when you join
- 👥 **Live user list** — see who's online in each room
- 🔄 **Room switching** — move between rooms without refreshing
- 🎭 **Random avatars** — each user gets a unique emoji avatar
- 📱 **Mobile responsive** — works on all screen sizes

---

## 🛠️ Tech Stack

| Layer      | Technology          |
|------------|---------------------|
| Runtime    | Node.js             |
| Server     | Express.js          |
| Real-time  | Socket.io           |
| Frontend   | Vanilla HTML/CSS/JS |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or higher
- npm (comes with Node.js)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/realtime-chat.git
cd realtime-chat

# 2. Install dependencies
npm install

# 3. Start the server
npm start
```

Open your browser at **http://localhost:3000**

> For development with auto-restart on file changes:
> ```bash
> npm run dev
> ```

---

## 📁 Project Structure

```
realtime-chat/
├── public/
│   ├── index.html      # Main HTML page
│   ├── style.css       # Stylesheet
│   └── app.js          # Client-side Socket.io logic
├── src/
│   └── server.js       # Express + Socket.io server
├── package.json
└── README.md
```

---

## 📡 Socket.io Events

### Client → Server

| Event         | Payload                        | Description              |
|---------------|--------------------------------|--------------------------|
| `join`        | `{ username, room }`           | Join a chat room         |
| `chatMessage` | `{ text }`                     | Send a message           |
| `typing`      | `{ isTyping }`                 | Broadcast typing status  |
| `switchRoom`  | `{ room }`                     | Move to a different room |

### Server → Client

| Event       | Payload                            | Description                   |
|-------------|------------------------------------|-------------------------------|
| `history`   | `Message[]`                        | Recent message history        |
| `message`   | `Message`                          | New incoming message          |
| `roomUsers` | `{ room, users[] }`               | Updated user list for a room  |
| `roomList`  | `{ name, count }[]`               | All rooms with online counts  |
| `typing`    | `{ username, isTyping }`           | Typing indicator update       |
| `roomChanged`| `roomName`                        | Confirmation of room switch   |

---

## 🌐 Deployment

### Deploy to Render (free)

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repo
4. Set **Start Command**: `npm start`
5. Deploy — Render handles the rest!

### Environment Variables

| Variable | Default | Description     |
|----------|---------|-----------------|
| `PORT`   | `3000`  | Server port     |

---

## 📸 Screenshots

> _(Add screenshots here after running the app)_

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first.

---

## 📄 License

[MIT](LICENSE)
