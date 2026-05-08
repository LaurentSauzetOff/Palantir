import { getCurrentProfile } from "@/lib/current-profile";
import { v4 as uuidv4 } from "uuid";
import * as z from "zod";

import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { MemberRole } from "@/lib/generated/prisma/enums";

const createServerSchema = z.object({
  name: z.string().trim().min(1).max(64),
  imageUrl: z.url(),
});

const INVITE_EXPIRATION_MS = 30 * 60 * 1000;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = createServerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request payload" },
        { status: 400 },
      );
    }

    const { name, imageUrl } = parsed.data;
    const profile = await getCurrentProfile();

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    let server;

    try {
      server = await prisma.server.create({
        data: {
          profileId: profile.id,
          name,
          imageURL: imageUrl,
          inviteCode: uuidv4(),
          inviteCodeExpiresAt: new Date(Date.now() + INVITE_EXPIRATION_MS),
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
    } catch {
      // Fallback temporaire tant que la migration n'est pas appliquée.
      server = await prisma.server.create({
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
    }

    return NextResponse.json(server);
  } catch (error) {
    console.log("[SERVERS_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
