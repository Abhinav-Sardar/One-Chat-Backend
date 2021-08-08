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
  socket.on("room-check", (roomName) => {
    const room = rooms.find((r) => r.name === roomName);
    socket.emit("room-check", room);
  });
  console.log("A new client has connected!");
  socket.on("new-user", (payload) => {
    if (rooms.length === 0) {
      rooms.push({
        name: payload.roomName,
        members: [
          {
            name: payload.name,
            profilePic: payload.profilePic,
          },
        ],
      });
      socket.emit("room-info", rooms[0].members);
      socket.join(payload.roomName);
    } else {
      const doesRoomExist = rooms.find((r) => r.name === payload.roomName);

      if (doesRoomExist) {
        console.log("Room already exists");
        doesRoomExist.members.push({
          name: payload.name,
          profilePic: payload.profilePic,
        });
        socket.join(payload.roomName);
        socket.to(payload.roomName).emit("room-info", doesRoomExist.members);
        socket.emit("room-info", doesRoomExist.members);
      } else {
        rooms.push({
          name: payload.roomName,
          members: [{ name: payload.name, profilePic: payload.profilePic }],
        });
        socket.join(payload.roomName);
        const members = rooms.find((r) => r.name === payload.roomName).members;
        socket.emit("room-info", members);
      }
    }
    socket.on("disconnect", () => {
      const userRoom = rooms.find((r) => r.name === payload.roomName);
      const filteredUsers = userRoom.members.filter(
        (user) => user.name !== payload.name
      );
      userRoom.members = filteredUsers;
      socket
        .to(payload.roomName)
        .emit("user-left", payload.name, userRoom.members);
    });
  });
});

/* 


{
	name:roomName , 
	members:  [
		{ name: userName , profilePic:<svg></svg>}
	]
}

*/

setInterval(() => {
  console.log(rooms);
}, 2000);

setInterval(() => {
  rooms.forEach((room, index) => {
    if (room.members.length === 0) {
      rooms.splice(index, 1);
    }
  });
}, 1000);
