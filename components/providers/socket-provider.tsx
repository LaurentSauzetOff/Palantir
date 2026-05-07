"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { socket as socketInstance } from "@/app/socket";

type SocketContextType = {
  socket: typeof socketInstance | null;
  isConnected: boolean;
  isLoading: boolean;
};

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  isLoading: true,
});

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const onConnect = () => {
      setIsConnected(true);
      setIsLoading(false);
    };

    const onDisconnect = () => {
      setIsConnected(false);
      setIsLoading(false);
    };

    const onConnectError = () => {
      setIsConnected(false);
      setIsLoading(false);
    };

    socketInstance.on("connect", onConnect);
    socketInstance.on("disconnect", onDisconnect);
    socketInstance.on("connect_error", onConnectError);

    if (socketInstance.connected) {
      setIsConnected(true);
      setIsLoading(false);
    } else {
      setIsConnected(false);
      setIsLoading(true);
      socketInstance.connect();
    }

    return () => {
      socketInstance.off("connect", onConnect);
      socketInstance.off("disconnect", onDisconnect);
      socketInstance.off("connect_error", onConnectError);
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket: socketInstance, isConnected, isLoading }}>
      {children}
    </SocketContext.Provider>
  );
};
