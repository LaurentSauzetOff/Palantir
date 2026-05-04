import { getCurrentProfile } from "@/lib/current-profile";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { ServerHeader } from "./server-header";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ServerSearch } from "./server-search";
import { ChannelType, MemberRole } from "@/lib/generated/prisma/enums";
import { Hash, Mic, ShieldAlert, ShieldCheck, Video } from "lucide-react";
import { Separator } from "../ui/separator";
import { ServerSection } from "./server-section";
import { ServerChannel } from "./server-channel";
import { ServerMember } from "./server-member";

interface ServerSidebarProps {
  serverId: string;
}

const iconMap = {
  [ChannelType.TEXT]: <Hash className="mr-2 h-4 w-4" />,
  [ChannelType.AUDIO]: <Mic className="mr-2 h-4 w-4" />,
  [ChannelType.VIDEO]: <Video className="mr-2 h-4 w-4" />,
};

const roleIconMap = {
  [MemberRole.GUEST]: null,
  [MemberRole.MODERATOR]: (
    <ShieldCheck className="h-4 w-4 mr-2 text-indigo-500" />
  ),
  [MemberRole.ADMIN]: <ShieldAlert className="h-4 w-4 mr-2 text-red-500" />,
};

export const ServerSidebar = async ({ serverId }: ServerSidebarProps) => {
  const profile = await getCurrentProfile();

  if (!profile) {
    return redirect("/");
  }

  const server = await prisma.server.findUnique({
    where: {
      id: serverId,
      members: {
        some: {
          profileId: profile.id,
        },
      },
    },
    include: {
      channels: {
        orderBy: {
          createdAt: "asc",
        },
      },
      members: {
        include: {
          profile: true,
        },
        orderBy: {
          role: "asc",
        },
      },
    },
  });

  if (!server) {
    return redirect("/");
  }

  const role = server.members.find(
    (member) => member.profileId === profile.id,
  )?.role;

  const members = server.members.filter(
    (member) => member.profileId !== profile.id,
  );

  return (
    <div className="flex flex-col h-full text-primary w-full dark:bg-[#2B2D31] bg-[#F2F3F5]">
      <ServerHeader server={server} role={role} />
      <ScrollArea className="flex-1 px-3">
        <div className="mt-2">
          <ServerSearch
            data={[
              {
                label: "Text Channels",
                type: "channel",
                data: server.channels
                  .filter((channel) => channel.type === ChannelType.TEXT)
                  .map((channel) => ({
                    id: channel.id,
                    name: channel.name,
                    icon: iconMap[channel.type],
                  })),
              },
              {
                label: "Voice Channels",
                type: "channel",
                data: server.channels
                  .filter((channel) => channel.type === ChannelType.AUDIO)
                  .map((channel) => ({
                    id: channel.id,
                    name: channel.name,
                    icon: iconMap[channel.type],
                  })),
              },
              {
                label: "Video Channels",
                type: "channel",
                data: server.channels
                  .filter((channel) => channel.type === ChannelType.VIDEO)
                  .map((channel) => ({
                    id: channel.id,
                    name: channel.name,
                    icon: iconMap[channel.type],
                  })),
              },
              {
                label: "Members",
                type: "member",
                data: server.members.map((member) => ({
                  id: member.id,
                  name: member.profile.name,
                  icon: roleIconMap[member.role],
                })),
              },
            ]}
          />
        </div>
        <Separator className="bg-zinc-200 dark:bg-zinc-700 rounded-md my-2" />
        <div className="mb-2">
          <ServerSection
            label="Text Channels"
            sectionType="channels"
            channelType={ChannelType.TEXT}
            role={role}
          />
          <div className="space-y-0.5">
            {server.channels
              .filter((channel) => channel.type === ChannelType.TEXT)
              .map((channel) => (
                <ServerChannel
                  key={channel.id}
                  channel={channel}
                  server={server}
                  role={role}
                />
              ))}
          </div>
        </div>
        {!!server.channels.filter(
          (channel) => channel.type === ChannelType.AUDIO,
        ).length && (
          <div className="mb-2">
            <ServerSection
              label="Voice Channels"
              sectionType="channels"
              channelType={ChannelType.AUDIO}
              role={role}
            />
            <div className="space-y-0.5">
              {server.channels
                .filter((channel) => channel.type === ChannelType.AUDIO)
                .map((channel) => (
                  <ServerChannel
                    key={channel.id}
                    channel={channel}
                    server={server}
                    role={role}
                  />
                ))}
            </div>
          </div>
        )}
        {!!server.channels.filter(
          (channel) => channel.type === ChannelType.VIDEO,
        ).length && (
          <div className="mb-2">
            <ServerSection
              label="Video Channels"
              sectionType="channels"
              channelType={ChannelType.VIDEO}
              role={role}
            />
            <div className="space-y-0.5">
              {server.channels
                .filter((channel) => channel.type === ChannelType.VIDEO)
                .map((channel) => (
                  <ServerChannel
                    key={channel.id}
                    channel={channel}
                    server={server}
                    role={role}
                  />
                ))}
            </div>
          </div>
        )}
        {!!members?.length && (
          <div className="mb-2">
            <ServerSection
              label="Members"
              sectionType="members"
              server={server}
              role={role}
            />
            <div className="space-y-0.5">
              {members.map((member) => (
                <ServerMember key={member.id} member={member} server={server} />
              ))}
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
