import { Server, Member, Profile } from "@/lib/generated/prisma/client";

export type ServerWithMembersWithProfiles = Server & {
  members: (Member & { profile: Profile })[];
};
