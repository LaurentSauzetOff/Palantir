import { getCurrentProfile } from "@/lib/current-profile";
import { prisma } from "@/lib/db";
import { ChannelType, MemberRole } from "@/lib/generated/prisma/enums";
import { NextResponse } from "next/server";
import * as z from "zod";

const jsonError = (error: string, status: number) =>
  NextResponse.json({ error }, { status });

const createChannelSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Name is required" })
    .max(64, { message: "Name is too long" })
    .refine((name) => name.toLowerCase() !== "general", {
      message: "Channel name cannot be 'general'",
    }),
  type: z.enum([ChannelType.TEXT, ChannelType.AUDIO, ChannelType.VIDEO]),
});

export async function POST(req: Request) {
  try {
    const profile = await getCurrentProfile();
    const body = await req.json();
    const parsed = createChannelSchema.safeParse(body);
    const { searchParams } = new URL(req.url);

    const serverId = searchParams.get("serverId");

    if (!profile) {
      return jsonError("Unauthorized", 401);
    }

    if (!serverId) {
      return jsonError("Server ID is required", 400);
    }

    if (!parsed.success) {
      return jsonError("Invalid request payload", 400);
    }

    const { name, type } = parsed.data;

    const server = await prisma.server.update({
      where: {
        id: serverId,
        members: {
          some: {
            profileId: profile.id,
            role: {
              in: [MemberRole.ADMIN, MemberRole.MODERATOR],
            },
          },
        },
      },
      data: {
        channels: {
          create: {
            profileId: profile.id,
            name,
            type,
          },
        },
      },
    });

    return NextResponse.json(server);
  } catch (error) {
    console.error("[CHANNEL_POST]", error);
    return jsonError("Internal server error", 500);
  }
}
