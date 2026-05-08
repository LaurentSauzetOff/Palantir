import { getCurrentProfile } from "@/lib/current-profile";
import { RedirectToSignIn } from "@clerk/nextjs";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { ChatHeader } from "@/components/chat/chat-header";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessages } from "@/components/chat/chat-messages";

interface ChannelIdPageProps {
  params: Promise<{
    serverId: string;
    channelId: string;
  }>;
}

const ChannelIdPage = async ({ params }: ChannelIdPageProps) => {
  const { serverId, channelId } = await params;
  const profile = await getCurrentProfile();

  if (!profile) {
    return <RedirectToSignIn />;
  }

  const channel = await prisma.channel.findUnique({
    where: {
      id: channelId,
    },
  });

  const member = await prisma.member.findFirst({
    where: {
      profileId: profile.id,
      serverId,
    },
  });

  if (!channel || !member) {
    redirect("/");
  }

  return (
    <div className="bg-white dark:bg-[#313338] flex flex-col h-full">
      <ChatHeader
        name={channel.name}
        serverId={channel.serverId}
        type="channel"
      />
      <ChatMessages
        member={member}
        name={channel.name}
        chatId={channel.id}
        type="channel"
        apiUrl="/api/messages"
        socketUrl="/api/messages"
        socketQuery={{ channelId, serverId: channel.serverId }}
        paramKey="channelId"
        paramValue={channelId}
      />
      <ChatInput
        name={channel.name}
        type="channel"
        apiUrl={"/api/messages"}
        memberName={profile.name}
        query={{
          channelId,
          serverId,
        }}
      />
    </div>
  );
};

export default ChannelIdPage;
