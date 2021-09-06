const express = require("express");
const CORS = require("cors");
const app = express();
const http = require("http");
const PORT = process.env.PORT || 1919;
const server = http.createServer(app);
const socketio = require("socket.io");

app.use(
  CORS({
    origin: "*",
  })
);
const io = socketio(server, {
  cors: {
    origin: "*",
  },
});

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});
app.get("/", (req, res) => {
  res.send("Hello World");
});

let rooms = [];

server.listen(PORT, () => {
  console.log("Listening on port ", PORT);
});
io.on("connection", (socket) => {
  socket.on("new-user", (payload) => {
    if (rooms.length === 0) {
      rooms.push({
        name: payload.roomName,
        members: [
          {
            name: payload.name,
            profilePic: payload.profilePic,
            host: true,
            id: socket.id,
          },
        ],
      });
      socket.emit("room-info", rooms[0].members);
      socket.emit("host");
      socket.join(payload.roomName);
    } else {
      const doesRoomExist = rooms.find((r) => r.name === payload.roomName);

      if (doesRoomExist) {
        doesRoomExist.members.push({
          name: payload.name,
          host: false,
          profilePic: payload.profilePic,
          id: socket.id,
        });
        socket.join(payload.roomName);
        socket.to(payload.roomName).emit("room-info", doesRoomExist.members);
        socket.emit("room-info", doesRoomExist.members);
      } else {
        rooms.push({
          name: payload.roomName,
          members: [
            {
              name: payload.name,
              profilePic: payload.profilePic,
              host: true,
              id: socket.id,
            },
          ],
        });
        socket.join(payload.roomName);
        const members = rooms.find((r) => r.name === payload.roomName).members;
        socket.emit("room-info", members);
        socket.emit("host");
      }
    }
    socket.on("message", (newMessage) => {
      socket.to(payload.roomName).emit("message", newMessage);
    });
    socket.on("disconnect", () => {
      const userRoom = rooms.find((r) => r.name === payload.roomName);
      const filteredUsers = userRoom.members.filter(
        (user) => user.name !== payload.name
      );
      if (filteredUsers.length !== 0) {
        const latestUser = filteredUsers[0];
        socket.to(latestUser.id).emit("host");
        latestUser.host = true;
      } else {
        userRoom.members = [];
      }
      userRoom.members = filteredUsers;

      socket
        .to(payload.roomName)
        .emit("user-left", payload.name, userRoom.members);
    });
    socket.on("ban-user", (userToBeBanned) => {
      const particularRoom = rooms.find((r) => r.name === payload.roomName);
      const user = particularRoom.members.find(
        (u) => u.name === userToBeBanned
      );
      const userIndex = particularRoom.members.indexOf(user);
      particularRoom.members.splice(userIndex, 1);
      socket.to(user.id).emit("ban");
      socket
        .to(payload.roomName)
        .emit(
          "user-banned",
          particularRoom.members,
          `${userToBeBanned} has been kicked by ${payload.name}`
        );
    });
  });
  socket.on("rooms", () => {
    socket.emit("rooms-back", rooms);
  });
});
setInterval(() => {
  rooms.forEach((room, index) => {
    if (room.members.length === 0) {
      rooms.splice(index, 1);
    }
  });
}, 1000);
