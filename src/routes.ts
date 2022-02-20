import { Router, Request, Response } from "express";
import { rooms } from "./index";
import socketCode from "./socket";
const router = Router();
router.get("/", (req: Request, res: Response) => {
  res.json(rooms);
});
router.post("/", (req: Request, res: Response) => {
  console.log(req.body);
  res.json({
    body: req.body,
    acknowledged: true,
  });
});
export default router;
