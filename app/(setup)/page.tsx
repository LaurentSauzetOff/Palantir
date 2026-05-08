import  { initialProfile } from "@/lib/initial-profile";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { InitialModal } from "@/components/modals/initial-modal";
import { NavigationUserButton } from "@/components/navigation/navigation-user-button";

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
    
  return (
    <>
      <div className="absolute top-4 right-4">
        <NavigationUserButton />
      </div>
      <InitialModal />
    </>
  );
};

export default SetupPage;
