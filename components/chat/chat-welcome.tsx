"use client";

import { Hash } from "lucide-react";

interface ChatWelcomeProps {
  type: "channel" | "conversation";
  name: string;
}

export const ChatWelcome = ({ type, name }: ChatWelcomeProps) => {
  return (
    <div className="space-y-2 px-4 mb-4">
      {type === "channel" && (
        <div className="h-18.75 w-18.75 rounded-full bg-zinc-500 dark:bg-zinc-700 flex items-center justify-center">
          <Hash className="h-8 w-8 text-white" />
        </div>
      )}
      <p className="text-xl md:text-xl font-bold">
        {type === "channel"
          ? `Welcome to ${name} channel.`
          : `Welcome to ${name} conversation.`}
      </p>
      <p className="text-zinc-600 dark:text-zinc-400 text-sm">
        {type === "channel"
          ? "This is the beginning of the channel."
          : "This is the beginning of the conversation."}
      </p>
    </div>
  );
};
