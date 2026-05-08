import { NextRequest, NextResponse } from "next/server";
import { MemberRole } from "@/lib/generated/prisma/enums";
import { getCurrentProfile } from "@/lib/current-profile";
import { prisma } from "@/lib/db";
import { getIo } from "@/lib/socket-io";
import { z } from "zod";

const updateMessageSchema = z.object({
  content: z.string().min(1).max(2000),
});

interface MessageParams {
  params: Promise<{ messageId: string }>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getMessageAndMember(
  messageId: string,
  serverId: string,
  channelId: string,
  profileId: string,
) {
  const server = await prisma.server.findFirst({
    where: {
      id: serverId,
      members: { some: { profileId } },
    },
    include: { members: true },
  });

  if (!server) return { error: "Server not found", status: 404 } as const;

  const channel = await prisma.channel.findFirst({
    where: { id: channelId, serverId },
  });

  if (!channel) return { error: "Channel not found", status: 404 } as const;

  const member = server.members.find((m) => m.profileId === profileId);
  if (!member) return { error: "Forbidden", status: 403 } as const;

  const message = await prisma.message.findFirst({
    where: { id: messageId, channelId },
    include: { member: { include: { profile: true } } },
  });

  if (!message || message.deleted)
    return { error: "Message not found", status: 404 } as const;

  return { server, channel, member, message } as const;
}

// ─── PATCH — edit message content ────────────────────────────────────────────

export async function PATCH(req: NextRequest, { params }: MessageParams) {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { messageId } = await params;
    const { searchParams } = req.nextUrl;
    const serverId = searchParams.get("serverId");
    const channelId = searchParams.get("channelId");

    if (!serverId || !channelId) {
      return NextResponse.json(
        { message: "serverId and channelId are required" },
        { status: 400 },
      );
    }

    const body = await req.json();
    const parsed = updateMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.errors[0].message },
        { status: 400 },
      );
    }

    const result = await getMessageAndMember(
      messageId,
      serverId,
      channelId,
      profile.id,
    );

    if ("error" in result) {
      return NextResponse.json({ message: result.error }, { status: result.status });
    }

    const { member, message } = result;

    // Only the message author can edit
    const isOwner = message.memberId === member.id;
    if (!isOwner) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: { content: parsed.data.content },
      include: { member: { include: { profile: true } } },
    });

    getIo().emit(`chat:${channelId}:messages:update`, updated);

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[MESSAGE_PATCH]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

// ─── DELETE — soft-delete message ────────────────────────────────────────────

export async function DELETE(req: NextRequest, { params }: MessageParams) {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { messageId } = await params;
    const { searchParams } = req.nextUrl;
    const serverId = searchParams.get("serverId");
    const channelId = searchParams.get("channelId");

    if (!serverId || !channelId) {
      return NextResponse.json(
        { message: "serverId and channelId are required" },
        { status: 400 },
      );
    }

    const result = await getMessageAndMember(
      messageId,
      serverId,
      channelId,
      profile.id,
    );

    if ("error" in result) {
      return NextResponse.json({ message: result.error }, { status: result.status });
    }

    const { member, message } = result;

    const isOwner = message.memberId === member.id;
    const isAdmin = member.role === MemberRole.ADMIN;
    const isModerator = member.role === MemberRole.MODERATOR;
    const canDelete = isOwner || isAdmin || isModerator;

    if (!canDelete) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const deleted = await prisma.message.update({
      where: { id: messageId },
      data: {
        deleted: true,
        content: "This message has been deleted.",
        fileUrl: null,
      },
      include: { member: { include: { profile: true } } },
    });

    getIo().emit(`chat:${channelId}:messages:update`, deleted);

    return NextResponse.json(deleted);
  } catch (error) {
    console.error("[MESSAGE_DELETE]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
