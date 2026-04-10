// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require("fs");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require("path");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const express = require("express");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const cors = require("cors");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Server } = require("socket.io");

const loadEnvFile = () => {
    const envPath = path.join(__dirname, ".env");

    if (!fs.existsSync(envPath)) {
        return;
    }

    const content = fs.readFileSync(envPath, "utf8");

    content.split(/\r?\n/).forEach((line) => {
        const trimmed = line.trim();

        if (!trimmed || trimmed.startsWith("#")) {
            return;
        }

        const separatorIndex = trimmed.indexOf("=");
        if (separatorIndex === -1) {
            return;
        }

        const key = trimmed.slice(0, separatorIndex).trim();
        if (!key || Object.prototype.hasOwnProperty.call(process.env, key)) {
            return;
        }

        let value = trimmed.slice(separatorIndex + 1).trim();

        if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
        ) {
            value = value.slice(1, -1);
        }

        process.env[key] = value;
    });
};

loadEnvFile();

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
    // eslint-disable-next-line no-console
    console.log(`[realtime] Socket server running on port ${port}`);
});