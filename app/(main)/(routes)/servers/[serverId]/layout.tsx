import { ServerSidebar } from "@/components/server/server-sidebar";
import { getCurrentProfile } from "@/lib/current-profile";
import { prisma } from "@/lib/db";
import { RedirectToSignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";

const ServerIdLayout = async ({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ serverId: string }>;
}) => {
  const { serverId } = await params;
  const profile = await getCurrentProfile();

  if (!profile) {
    return <RedirectToSignIn />;
  }

  const server = await prisma.server.findFirst({
    where: {
      id: serverId,
      members: {
        some: {
          profileId: profile.id,
        },
      },
    },
  });

  if (!server) {
    return redirect("/");
  }

  return (
    <div className="h-full">
      <div className="inset-y-0 left-18 max-md:hidden flex w-60 z-20 fixed flex-col"><ServerSidebar serverId={serverId} /></div>
      <main className="h-full md:pl-60">{children}</main>
    </div>
  );
};

export default ServerIdLayout;
