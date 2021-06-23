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
	socket.on("new", ([name, room]) => {
		if (rooms.length === 0) {
			rooms.push([room, [name]]);
			socket.emit("room-info", rooms[0][1]);
			socket.join(room);
			socket.to(room).emit("new-user", [name, rooms[0][1]]);
		} else {
			let useroom = rooms.map((eachroom) => eachroom[0] === room);
			let index = useroom.indexOf(true);
			if (index !== -1) {
				rooms[index][1].push(name);
				socket.join(rooms[index][0]);
				socket.to(rooms[index][0]).emit("new-user", [name, rooms[index][1]]);
				socket.emit("room-info", rooms[index][1]);
			} else {
				rooms.push([room, [name]]);
				socket.emit("room-info", rooms[rooms.length - 1][1]);
				socket.join(room);
				socket.to(room).emit("new-user", [rooms[0][0], rooms[0][1]]);
			}
			//  [[] , []]
		}
		socket.on("message", ([room, value, author, created_at]) => {
			socket.to(room).emit("foreign-message", [value, author, created_at]);
		});
		socket.on("disconnect", () => {
			let useroom = rooms.map((eachroom) => eachroom[0] === room);
			let index = useroom.indexOf(true);
			rooms[index][1].splice(rooms[index][1].indexOf(name), 1);
			socket.to(rooms[index][0]).emit("user-left", [name, rooms[index][1]]);
		});
	});
	socket.on("req-info", () => socket.emit("res-info", rooms));
});
setInterval(() => {
	rooms.forEach((room, index) => {
		if (room[1].length === 0) {
			rooms.splice(index, 1);
		}
	});
}, 1000);
