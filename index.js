const express = require("express");
const CORS = require("cors");
const app = express();
const http = require("http");
const PORT = process.env.PORT || 1919;
const server = http.createServer(app);
const socketio = require("socket.io");

app.use(CORS());
const io = socketio(server, {
	cors: {
		origin: "*",
	},
});

app.get("/", (req, res) => {
	res.send("Hello World");
});
app.get("/rooms", (req, res) => {
	const filteredRooms = rooms.filter((room) => room.isPrivate === false);
	res.json(extractMembersList(filteredRooms));
});
let rooms = [];

server.listen(PORT, () => {
	console.log("Listening on port ", PORT);
});
io.on("connection", (socket) => {
	socket.on("new-user", (payload) => {
		if (rooms.length === 0) {
			rooms.push({
				isPrivate: payload.isPrivate,
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
				socket
					.to(payload.roomName)
					.emit("new-user-join", doesRoomExist.members, payload.name);
				socket.emit("room-info", doesRoomExist.members);
			} else {
				rooms.push({
					isPrivate: payload.isPrivate,
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
		socket.on("end-room", () => {
			const currentRoom = rooms.find((r) => r.name === payload.roomName);
			const index = rooms.indexOf(currentRoom);
			rooms.splice(index, 1);
			socket.to(payload.roomName).emit("room-ended");
			socket.emit("room-ended");
		});
		socket.on("disconnect", () => {
			const userRoom = rooms.find((r) => r.name === payload.roomName);
			if (!userRoom) return;
			const self = userRoom.members.find((r) => r.id === socket.id);
			if (!self) return;
			const filteredUsers = userRoom.members.filter((user) => user.id !== socket.id);
			if (filteredUsers.length === 0) {
				if (userRoom) {
					userRoom.members = [];
				} else return;

				return;
			} else {
				if (!self) {
					return;
				} else {
					if (self.host) {
						const newHost = filteredUsers[0];
						newHost.host = true;
						userRoom.members = filteredUsers;
						socket
							.to(payload.roomName)
							.emit("new-host", payload.name, userRoom.members, newHost.name);
						socket.to(newHost.id).emit("host");
					} else {
						userRoom.members = filteredUsers;
						socket.to(payload.roomName).emit("user-left", payload.name, userRoom.members);
					}
				}
			}
		});
		socket.on("ban-user", (userToBeBanned, reason) => {
			const particularRoom = rooms.find((r) => r.name === payload.roomName);
			if (!particularRoom) return;
			const user = particularRoom.members.find((u) => u.name === userToBeBanned);
			if (!user) return;
			const userIndex = particularRoom.members.indexOf(user);
			particularRoom.members.splice(userIndex, 1);
			socket.to(user.id).emit("ban", reason);
			socket
				.to(payload.roomName)
				.emit(
					"user-banned",
					particularRoom.members,
					`${userToBeBanned} has been kicked by ${payload.name}`
				);
			socket.emit(
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
});

const extractMembersList = (specialRooms) => {
	const roomToBeReturned = [];
	specialRooms.forEach((room) => {
		const length = room.members.length;
		roomToBeReturned.push({ ...room, members: [], membersLength: length });
	});
	return roomToBeReturned;
};
//
