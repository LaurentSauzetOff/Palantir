import { Server as NetServer } from "http";
import { Server as ServerIO } from "socket.io";
import { NextApiRequest } from "next";

import { NextApiResponseServerIo } from "@/types";

export const config = {
  api: {
    bodyParser: false,
  },
};

const iotHandler = (
  req: NextApiRequest,
  res: NextApiResponseServerIo,
) => {
  if (!res.socket.server.io) {
    const httpServer: NetServer = res.socket.server as any;
    const io = new ServerIO(httpServer, {
      path: "/api/socket/io",
      addTrailingSlash: false,
    });
    res.socket.server.io = io;
  }

  res.socket.server.io.engine.handleRequest(req as any, res as any);
};

export default iotHandler;
