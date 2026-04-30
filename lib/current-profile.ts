import { auth } from "@clerk/nextjs/server";

import { prisma } from "@/lib/db";

export const getCurrentProfile = async () => {
  const { userId } = await auth();

  if (!userId) return null;

  const profile = await prisma.profile.findUnique({
    where: {
      userId,
    },
  });

  return profile;
};
