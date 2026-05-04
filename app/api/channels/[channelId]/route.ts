import { getCurrentProfile } from "@/lib/current-profile";
import { prisma } from "@/lib/db";
import { MemberRole } from "@/lib/generated/prisma/enums";
import { NextResponse } from "next/server";
import * as z from "zod";

const updateChannelSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Name is required" })
    .max(64, { message: "Name is too long" })
    .refine((name) => name.toLowerCase() !== "general", {
      message: "Channel name cannot be 'general'",
    }),
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
    include: {
      server: true,
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
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!channelId) {
      return new NextResponse("Channel ID is required", { status: 400 });
    }

    const channel = await getAuthorizedChannel(channelId, profile.id);

    if (!channel) {
      return new NextResponse("Channel not found", { status: 404 });
    }

    if (channel.name === "general") {
      return new NextResponse("Channel name cannot be 'general'", {
        status: 400,
      });
    }

    await prisma.channel.delete({
      where: {
        id: channel.id,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[CHANNEL_DELETE]", error);
    return new NextResponse("Internal server error", { status: 500 });
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
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!channelId) {
      return new NextResponse("Channel ID is required", { status: 400 });
    }

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request payload" },
        { status: 400 },
      );
    }

    const { name } = parsed.data;

    const channel = await getAuthorizedChannel(channelId, profile.id);

    if (!channel) {
      return new NextResponse("Channel not found", { status: 404 });
    }

    const updatedChannel = await prisma.channel.update({
      where: {
        id: channel.id,
      },
      data: {
        name,
      },
    });

    return NextResponse.json(updatedChannel);
  } catch (error) {
    console.error("[CHANNEL_PATCH]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
