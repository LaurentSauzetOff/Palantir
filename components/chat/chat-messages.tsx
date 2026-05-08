"use client";

import { Member, Message, Profile } from "@/lib/generated/prisma/client";
import { format } from "date-fns";
import { ChatWelcome } from "@/components/chat/chat-welcome";
import { useChatQuery } from "@/hooks/use-chat-query";
import { useChatSocket } from "@/hooks/use-chat-socket";
import { useChatScroll } from "@/hooks/use-chat-scroll";
import { useChatTyping } from "@/hooks/use-chat-typing";
import { Loader2, ServerCrash } from "lucide-react";
import { Fragment, useRef } from "react";
import { ChatItem } from "./chat-item";
import { ChatTypingIndicator } from "./chat-typing-indicator";

const DATE_FORMAT = "d MMM yyyy, HH:mm";

type MessageWithMemberWithProfile = Message & {
  member: Member & {
    profile: Profile;
  };
};

interface ChatMessagesProps {
  name: string;
  member: Member;
  chatId: string;
  apiUrl: string;
  socketUrl: string;
  socketQuery: Record<string, string>;
  paramKey: "channelId" | "conversationId";
  paramValue: string;
  type: "channel" | "conversation";
}

export const ChatMessages = ({
  name,
  member,
  chatId,
  apiUrl,
  socketUrl,
  socketQuery,
  paramKey,
  paramValue,
  type,
}: ChatMessagesProps) => {
  const queryKey = `chat:${chatId}`;
  const addKey = `chat:${chatId}:messages`;
  const updateKey = `chat:${chatId}:messages:update`;

  const chatRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useChatQuery({
      queryKey,
      apiUrl,
      paramKey,
      paramValue,
    });

  useChatSocket({ addKey, updateKey, queryKey });

  const typingUsers = useChatTyping(chatId);

  const count = data?.pages?.reduce((acc, page) => acc + page.items.length, 0) ?? 0;

  useChatScroll({
    chatRef,
    bottomRef,
    count,
    loadMore: fetchNextPage,
    shouldLoadMore: !isFetchingNextPage && !!hasNextPage,
  });

  if (status === "pending") {
    return (
      <div className="flex-1 flex flex-col p-4 overflow-y-auto">
        <Loader2 className="animate-spin h-6 w-6 text-zinc-500 self-center" />
        <p className="text-center text-gray-500 dark:text-gray-400">
          Loading messages...
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex-1 flex flex-col p-4 overflow-y-auto">
        <ServerCrash className="h-6 w-6 text-zinc-500 self-center" />
        <p className="text-center text-gray-500 dark:text-gray-400">
          Error loading messages.
        </p>
      </div>
    );
  }

  return (
    <div ref={chatRef} className="flex-1 flex flex-col p-4 overflow-y-auto">
      <div className="flex-1" />
      <ChatWelcome type={type} name={name} />
      <div className="flex flex-col-reverse mt-auto">
        {data?.pages?.map((group, i) => (
          <Fragment key={i}>
            {group.items.map((message: MessageWithMemberWithProfile) => (
              <ChatItem
                key={message.id}
                id={message.id}
                currentMember={member}
                member={message.member}
                content={message.content}
                fileUrl={message.fileUrl}
                deleted={message.deleted}
                timestamp={format(new Date(message.createdAt), DATE_FORMAT)}
                isUpdated={message.updatedAt !== message.createdAt}
                socketUrl={socketUrl}
                socketQuery={socketQuery}
              />
            ))}
          </Fragment>
        ))}
      </div>
      <div ref={bottomRef} />
      <ChatTypingIndicator typingUsers={typingUsers} />
    </div>
  );
};
