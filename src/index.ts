import express, { Request, Response } from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import router from "./routes";
import { Room } from "./types";
import socketCode from "./socket";
const PORT = process.env.PORT || 1919;
const app = express();
export let rooms: Room[] = [];
app.use(
  "/rooms",
  cors({
    origin: ["https://fetchy.netlify.app", "http://localhost:3000"],
  }),
  express.json(),
  router
);
app.all("*", (req: Request, res: Response) => {
  res.status(404).setHeader("Content-Type", "text/html").send("<h1>404 Not Found</h1>");
});
const server = http.createServer(app);
server.listen(PORT, () => console.log("Server Started!"));

const io = new Server(server, {
  cors: { origin: ["https://fetchy.netlify.app", "http://localhost:3000"] },
  maxHttpBufferSize: 1e6 * 1024,
});
socketCode(io);
