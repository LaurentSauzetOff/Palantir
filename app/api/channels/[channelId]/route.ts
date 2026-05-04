import { getCurrentProfile } from "@/lib/current-profile";
import { prisma } from "@/lib/db";
import { ChannelType, MemberRole } from "@/lib/generated/prisma/enums";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import * as z from "zod";

const jsonError = (error: string, status: number) =>
  NextResponse.json({ error }, { status });

const channelTypeValues = [
  ChannelType.TEXT,
  ChannelType.AUDIO,
  ChannelType.VIDEO,
] as const;

const updateChannelSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Name is required" })
    .max(64, { message: "Name is too long" })
    .refine((name) => name.toLowerCase() !== "general", {
      message: "Channel name cannot be 'general'",
    }),
  type: z.enum(channelTypeValues),
});

async function getAuthorizedChannel(channelId: string, profileId: string) {
  return prisma.channel.findFirst({
    where: {
      id: channelId,
      server: {
        members: {
          some: {
            profileId,
            role: {
              in: [MemberRole.ADMIN, MemberRole.MODERATOR],
            },
          },
        },
      },
    },
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ channelId: string }> },
) {
  try {
    const profile = await getCurrentProfile();
    const { channelId } = await params;

    if (!profile) {
      return jsonError("Unauthorized", 401);
    }

    if (!channelId) {
      return jsonError("Channel ID is required", 400);
    }

    const channel = await getAuthorizedChannel(channelId, profile.id);

    if (!channel) {
      return jsonError("Channel not found", 404);
    }

    if (channel.name.toLowerCase() === "general") {
      return jsonError("Channel name cannot be 'general'", 400);
    }

    await prisma.channel.delete({
      where: {
        id: channel.id,
      },
    });

    revalidatePath(`/servers/${channel.serverId}`);
    revalidatePath(`/servers/${channel.serverId}/channels/${channel.id}`);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[CHANNEL_DELETE]", error);
    return jsonError("Internal server error", 500);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ channelId: string }> },
) {
  try {
    const profile = await getCurrentProfile();
    const { channelId } = await params;
    const body = await req.json();
    const parsed = updateChannelSchema.safeParse(body);

    if (!profile) {
      return jsonError("Unauthorized", 401);
    }

    if (!channelId) {
      return jsonError("Channel ID is required", 400);
    }

    if (!parsed.success) {
      return jsonError("Invalid request payload", 400);
    }

    const { name, type } = parsed.data;

    const channel = await getAuthorizedChannel(channelId, profile.id);

    if (!channel) {
      return jsonError("Channel not found", 404);
    }

    const updatedChannel = await prisma.channel.update({
      where: {
        id: channel.id,
      },
      data: {
        name,
        type,
      },
    });

    revalidatePath(`/servers/${channel.serverId}`);
    revalidatePath(`/servers/${channel.serverId}/channels/${channel.id}`);

    return NextResponse.json(updatedChannel);
  } catch (error) {
    console.error("[CHANNEL_PATCH]", error);
    return jsonError("Internal server error", 500);
  }
}
