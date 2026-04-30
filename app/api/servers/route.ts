import { getCurrentProfile } from "@/lib/current-profile";
import { v4 as uuidv4 } from "uuid";

import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { MemberRole } from "@/lib/generated/prisma/enums";

export async function POST(req: Request) {
  try {
    const { name, imageUrl } = await req.json();
    const profile = await getCurrentProfile();

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const server = await prisma.server.create({
      data: {
        profileId: profile.id,
        name,
        imageURL: imageUrl,
        inviteCode: uuidv4(),
        channels: {
          create: [{ name: "general", profileId: profile.id }],
        },
        members: {
          create: [
            {
              profileId: profile.id,
              role: MemberRole.ADMIN,
            },
          ],
        },
      },
    });

    return NextResponse.json(server);
  } catch (error) {
    console.log("[SERVERS_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
