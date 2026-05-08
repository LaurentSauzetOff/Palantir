"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/components/providers/socket-provider";

interface ServerSidebarRealtimeProps {
  serverId: string;
}

export const ServerSidebarRealtime = ({
  serverId,
}: ServerSidebarRealtimeProps) => {
  const { socket } = useSocket();
  const router = useRouter();

  useEffect(() => {
    if (!socket) return;

    const eventKey = `server:${serverId}:members:update`;
    const handleMembersUpdate = () => {
      router.refresh();
    };

    socket.on(eventKey, handleMembersUpdate);

    return () => {
      socket.off(eventKey, handleMembersUpdate);
    };
  }, [socket, router, serverId]);

  return null;
};
