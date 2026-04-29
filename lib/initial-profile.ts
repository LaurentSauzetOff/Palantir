import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export const initialProfile = async () => {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  const existingProfile = await prisma.profile.findUnique({
    where: {
      userId: user.id,
    },
  });

  if (existingProfile) {
    return existingProfile;
  }

  const email = user.emailAddresses[0]?.emailAddress ?? "";
  const name =
    `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
    user.username ||
    "User";

  return prisma.profile.create({
    data: {
      userId: user.id,
      name,
      imageUrl: user.imageUrl,
      email,
    },
  });
};

export default initialProfile;

