"use client";

import type { Channel, Server } from "@/lib/generated/prisma/client";
import { ChannelType, MemberRole } from "@/lib/generated/prisma/enums";
import { cn } from "@/lib/utils";
import {
  Edit,
  Hash,
  Lock,
  Mic,
  Trash,
  Video,
  type LucideIcon,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { ActionTooltip } from "@/components/action-tooltip";
import { ModalType, useModal } from "@/hooks/use-modal-store";

interface ServerChannelProps {
  channel: Channel;
  server: Server;
  role?: MemberRole;
}

const iconMap: Record<ChannelType, LucideIcon> = {
  [ChannelType.TEXT]: Hash,
  [ChannelType.AUDIO]: Mic,
  [ChannelType.VIDEO]: Video,
};

export const ServerChannel = ({
  channel,
  server,
  role,
}: ServerChannelProps) => {
  const { onOpen } = useModal();
  const params = useParams();
  const router = useRouter();

  const Icon = iconMap[channel.type];

  const onClick = () => {
    router.push(`/servers/${server.id}/channels/${channel.id}`);
  };

  const onAction = (e: React.MouseEvent, action: ModalType) => {
    e.stopPropagation();
    onOpen(action, { channel, server });
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          router.push(`/servers/${server.id}/channels/${channel.id}`);
        }
      }}
      className={cn(
        "group px-2 py-2 rounded-md flex items-center gap-x-2 w-full hover:bg-zinc-700/10 dark:hover:bg-zinc-700/50 transition mb-1 cursor-pointer",
        params?.channelId === channel.id &&
          "bg-zinc-700/10 dark:bg-zinc-700/50",
      )}
    >
      <Icon className="shrink-0 w-5 h-5 text-zinc-500 dark:text-zinc-400" />
      <p
        className={cn(
          "text-sm line-clamp-1 font-semibold text-zinc-500 group-hover:text-zinc-600 dark:text-zinc-400 dark:group-hover:text-zinc-300 transition",
          params?.channelId === channel.id &&
            "text-primary dark:text-zinc-200 dark:group-hover:text-white",
        )}
      >
        {channel.name}
      </p>
      {channel.name !== "general" && role !== MemberRole.GUEST && (
        <div className="ml-auto flex items-center gap-x-2">
          <ActionTooltip label="edit">
            <button
              type="button"
              aria-label={`Edit channel ${channel.name}`}
              className="p-1 rounded-sm text-zinc-500 hover:text-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-300 transition opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100"
              onClick={(event) => onAction(event, "editChannel")}
            >
              <Edit className="w-4 h-4" />
            </button>
          </ActionTooltip>
          <ActionTooltip label="delete">
            <button
              type="button"
              aria-label={`Delete channel ${channel.name}`}
              className="p-1 rounded-sm text-zinc-500 hover:text-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-300 transition opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100"
              onClick={(e) => onAction(e, "deleteChannel")}
            >
              <Trash className="w-4 h-4" />
            </button>
          </ActionTooltip>
        </div>
      )}
      {channel.name === "general" && (
        <Lock className="ml-auto w-4 h-4 text-zinc-500 dark:text-zinc-400" />
      )}
    </div>
  );
};
