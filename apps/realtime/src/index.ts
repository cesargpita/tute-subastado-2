import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";

type Player = { id: string; name: string; socketId: string };
type Table = {
  id: string;
  players: Player[];
  phase: "lobby" | "dealing" | "bidding" | "playing" | "scoring";
};

const tables = new Map<string, Table>();

function newId() {
  return Math.random().toString(36).slice(2, 10);
}

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: ["http://localhost:3000"], methods: ["GET", "POST"] }
});

io.on("connection", (socket) => {
  socket.on("table:create", (_payload: unknown, ack?: Function) => {
    const table: Table = { id: newId(), players: [], phase: "lobby" };
    tables.set(table.id, table);
    ack?.({ ok: true, tableId: table.id });
  });

  socket.on("table:join", (payload: { tableId: string; name: string; playerId: string }, ack?: Function) => {
    const table = tables.get(payload.tableId);
    if (!table) return ack?.({ ok: false, error: "TABLE_NOT_FOUND" });

    const existing = table.players.find(p => p.id === payload.playerId);
    if (existing) {
      existing.name = payload.name;
      existing.socketId = socket.id;
    } else {
      table.players.push({ id: payload.playerId, name: payload.name, socketId: socket.id });
    }

    socket.join(table.id);
    io.to(table.id).emit("table:state", { table: { id: table.id, phase: table.phase, players: table.players.map(p => ({ id: p.id, name: p.name })) } });
    ack?.({ ok: true });
  });

  socket.on("disconnect", () => {});
});

const PORT = Number(process.env.PORT ?? 4000);
server.listen(PORT, () => console.log(`realtime listening on http://localhost:${PORT}`));
