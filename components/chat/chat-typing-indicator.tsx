"use client";

interface ChatTypingIndicatorProps {
  typingUsers: { memberId: string; name: string }[];
}

export const ChatTypingIndicator = ({
  typingUsers,
}: ChatTypingIndicatorProps) => {
  if (typingUsers.length === 0) return null;

  const label =
    typingUsers.length === 1
      ? `${typingUsers[0].name} est en train d'écrire`
      : typingUsers.length === 2
        ? `${typingUsers[0].name} et ${typingUsers[1].name} sont en train d'écrire`
        : `${typingUsers.length} personnes sont en train d'écrire`;

  return (
    <div className="flex items-center gap-x-2 px-4 py-1 text-xs text-zinc-500 dark:text-zinc-400">
      <span className="flex items-end gap-[3px] h-4">
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce [animation-delay:300ms]" />
      </span>
      <span>{label}</span>
    </div>
  );
};
