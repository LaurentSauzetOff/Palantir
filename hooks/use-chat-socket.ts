"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "@/components/providers/socket-provider";
import type { Member, Message, Profile } from "@/lib/generated/prisma/client";

type MessageWithMember = Message & {
  member: Member & { profile: Profile };
};

interface UseChatSocketProps {
  addKey: string;    // ex: "chat:{channelId}:messages"
  updateKey: string; // ex: "chat:{channelId}:messages:update"
  queryKey: string;  // clé React Query à patcher
}

export const useChatSocket = ({
  addKey,
  updateKey,
  queryKey,
}: UseChatSocketProps) => {
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket) return;

    // Nouveau message → inséré en tête de la première page
    const handleAdd = (message: MessageWithMember) => {
      queryClient.setQueryData([queryKey], (old: any) => {
        if (!old || !old.pages || old.pages.length === 0) {
          return { pages: [{ items: [message] }], pageParams: [undefined] };
        }
        const newPages = [...old.pages];
        newPages[0] = {
          ...newPages[0],
          items: [message, ...newPages[0].items],
        };
        return { ...old, pages: newPages };
      });
    };

    // Message édité ou supprimé → patché dans toutes les pages
    const handleUpdate = (message: MessageWithMember) => {
      queryClient.setQueryData([queryKey], (old: any) => {
        if (!old || !old.pages) return old;
        const newPages = old.pages.map((page: any) => ({
          ...page,
          items: page.items.map((item: MessageWithMember) =>
            item.id === message.id ? message : item,
          ),
        }));
        return { ...old, pages: newPages };
      });
    };

    socket.on(addKey, handleAdd);
    socket.on(updateKey, handleUpdate);

    return () => {
      socket.off(addKey, handleAdd);
      socket.off(updateKey, handleUpdate);
    };
  }, [socket, queryClient, addKey, updateKey, queryKey]);
};
