import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new Server(httpServer);

  globalThis.__socketio = io;

  io.on("connection", (socket) => {
    console.log(`[Socket.IO] Client connecté : ${socket.id}`);

    // Relayer les événements de frappe entre clients d'un même canal
    socket.on("typing", ({ channelId, name, memberId }) => {
      socket.broadcast.emit(`chat:${channelId}:typing`, { name, memberId });
    });

    socket.on("stop-typing", ({ channelId, memberId }) => {
      socket.broadcast.emit(`chat:${channelId}:stop-typing`, { memberId });
    });

    socket.on("disconnect", () => {
      console.log(`[Socket.IO] Client déconnecté : ${socket.id}`);
    });
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log(`> Socket.IO actif sur http://${hostname}:${port}`);
    });
});
