"use client";

import { useSocket } from "@/components/providers/socket-provider";
import { Badge } from "@/components/ui/badge";

export const SocketIndicator = () => {
  const { isConnected, isLoading } = useSocket();

  if (isLoading) {
    return (
      <Badge variant="outline" className="bg-zinc-500 text-white border-none">
        Connecting...
      </Badge>
    );
  }

  if (!isConnected) {
    return (
      <Badge variant="outline" className="bg-yellow-600 text-white border-none">
        Fallback : Polling every one seconde
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="bg-emerald-600 text-white border-none">
      Live: real-time updates
    </Badge>
  );
};
