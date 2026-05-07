import { Server } from "socket.io";

declare global {
  // eslint-disable-next-line no-var
  var __socketio: Server | undefined;
}

export function getIo(): Server {
  if (!global.__socketio) {
    throw new Error("[Socket.IO] Instance non initialisée. server.js est-il actif ?");
  }
  return global.__socketio;
}
