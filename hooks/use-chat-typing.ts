"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/components/providers/socket-provider";

interface TypingUser {
  memberId: string;
  name: string;
}

export const useChatTyping = (channelId: string) => {
  const { socket } = useSocket();
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

  useEffect(() => {
    if (!socket) return;

    const handleTyping = ({ name, memberId }: TypingUser) => {
      setTypingUsers((prev) => {
        if (prev.some((u) => u.memberId === memberId)) return prev;
        return [...prev, { name, memberId }];
      });
    };

    const handleStopTyping = ({ memberId }: { memberId: string }) => {
      setTypingUsers((prev) => prev.filter((u) => u.memberId !== memberId));
    };

    socket.on(`chat:${channelId}:typing`, handleTyping);
    socket.on(`chat:${channelId}:stop-typing`, handleStopTyping);

    return () => {
      socket.off(`chat:${channelId}:typing`, handleTyping);
      socket.off(`chat:${channelId}:stop-typing`, handleStopTyping);
    };
  }, [socket, channelId]);

  return typingUsers;
};
