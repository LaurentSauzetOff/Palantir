import { getCurrentProfile } from "@/lib/current-profile";
import { prisma } from "@/lib/db";
import { RedirectToSignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";

interface ServerIdPageProps {
  params: {
    serverId: string;
  };
}

const ServerIdPage = async ({ params }: ServerIdPageProps) => {
  const { serverId } = params;
  const profile = await getCurrentProfile();

  if(!profile) {
    return <RedirectToSignIn />;
  }

  const server = await prisma.server.findUnique({
    where: {
      id: params.serverId,
      members: {
        some: {
          profileId: profile.id,
        }
      }
    },
    include: {
      channels: {
        where: {
          name: "general"
        },
        orderBy: {
          createdAt: "asc"
        }
      }
    }
  }) 

  const initialChannel = server?.channels[0];

  if(initialChannel?.name !== "general") {
    return  null;
  }

  return redirect(`/servers/${serverId}/channels/${initialChannel.id}`);
};

export default ServerIdPage;
