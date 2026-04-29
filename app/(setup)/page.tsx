import  { initialProfile } from "@/lib/initial-profile";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

const SetupPage = async () => {
    const profile = await initialProfile();

    if (!profile) {
        return redirect("/sign-in");
    }

    const server = await prisma.server.findFirst({
        where: {
            members: {
                some: {
                    profileId: profile.id
                }
            }
        }
    })

    if (server) {
        return redirect(`/servers/${server.id}`);
    }
    
  return <div>Create a server</div>;
};

export default SetupPage;
