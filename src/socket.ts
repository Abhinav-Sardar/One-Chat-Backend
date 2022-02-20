import { Server } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";

const socketCode = (io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) => {
  io.on("connection", socket => {
    console.log("A fucking user connected");
  });
};
export default socketCode;
