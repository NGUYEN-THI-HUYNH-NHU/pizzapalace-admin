import express, { json } from "express";
import { createServer } from "http";
import cors from "cors";
import { Server } from "socket.io";

const port = Number(process.env.PORT || process.env.REALTIME_PORT || 4001);
const emitSecret = process.env.REALTIME_EMIT_SECRET;
const rawOrigins = process.env.REALTIME_ALLOWED_ORIGINS;
const allowedOrigins = rawOrigins.split(",").map((item) => item.trim()).filter(Boolean);

const app = express();
app.use(json());
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/emit", (req, res) => {
  const secret = req.headers["x-realtime-secret"];
  if (secret !== emitSecret) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { event, payload, rooms } = req.body || {};

  if (!event || typeof event !== "string") {
    return res.status(400).json({ message: "Missing event" });
  }

  if (Array.isArray(rooms) && rooms.length > 0) {
    rooms.forEach((room) => {
      if (typeof room === "string" && room.trim()) {
        io.to(room).emit(event, payload ?? {});
      }
    });
  } else {
    io.emit(event, payload ?? {});
  }

  return res.json({ ok: true });
});

io.on("connection", (socket) => {
  socket.on("join:admin", () => {
    socket.join("admins");
  });

  socket.on("join:user", (payload) => {
    const userId = typeof payload?.userId === "string" ? payload.userId.trim() : "";
    if (!userId) {
      return;
    }

    socket.join(`user:${userId}`);
  });
});

server.listen(port, () => {
  console.log(`[realtime] Socket server running on port ${port}`);
});
