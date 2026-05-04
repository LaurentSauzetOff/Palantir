import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { getCurrentProfile } from "@/lib/current-profile";
import { prisma } from "@/lib/db";
import { ChannelType } from "@/lib/generated/prisma/enums";
import { Hash, Mic, Video } from "lucide-react";
import { redirect } from "next/navigation";

const iconMap = {
  [ChannelType.TEXT]: Hash,
  [ChannelType.AUDIO]: Mic,
  [ChannelType.VIDEO]: Video,
};

const labelMap = {
  [ChannelType.TEXT]: "textuel",
  [ChannelType.AUDIO]: "vocal",
  [ChannelType.VIDEO]: "video",
};

const ChannelIdPage = async ({
  params,
}: {
  params: Promise<{ serverId: string; channelId: string }>;
}) => {
  const { serverId, channelId } = await params;
  const profile = await getCurrentProfile();

  if (!profile) {
    return redirect("/");
  }

  const channel = await prisma.channel.findFirst({
    where: {
      id: channelId,
      serverId,
      server: {
        members: {
          some: {
            profileId: profile.id,
          },
        },
      },
    },
  });

  if (!channel) {
    return redirect(`/servers/${serverId}`);
  }

  const Icon = iconMap[channel.type];
  const channelKind = labelMap[channel.type];

  return (
    <div className="flex h-full items-center justify-center p-6">
      <Empty className="max-w-md border border-dashed border-zinc-200 bg-white/60 dark:border-zinc-800 dark:bg-zinc-900/40">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Icon className="size-4" />
          </EmptyMedia>
          <EmptyTitle>#{channel.name}</EmptyTitle>
          <EmptyDescription>
            Canal {channelKind} pret. Le contenu interactif de cette page sera ajoute dans le prochain chapitre.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );
};

export default ChannelIdPage;