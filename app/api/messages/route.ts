import { NextRequest, NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/current-profile";
import { prisma } from "@/lib/db";
import { getIo } from "@/lib/socket-io";
import { Message } from "@/lib/generated/prisma/client";

const MESSAGES_BATCH = 10;

export async function POST(req: NextRequest) {
  try {
    const profile = await getCurrentProfile();

    if (!profile) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { content, fileUrl } = await req.json();
    const { searchParams } = req.nextUrl;
    const serverId = searchParams.get("serverId");
    const channelId = searchParams.get("channelId");

    if (!serverId) {
      return NextResponse.json(
        { message: "Server ID is required" },
        { status: 400 },
      );
    }

    if (!channelId) {
      return NextResponse.json(
        { message: "Channel ID is required" },
        { status: 400 },
      );
    }

    if (!content) {
      return NextResponse.json(
        { message: "Content is required" },
        { status: 400 },
      );
    }

    const server = await prisma.server.findFirst({
      where: {
        id: serverId,
        members: {
          some: {
            profileId: profile.id,
          },
        },
      },
      include: {
        members: true,
      },
    });

    if (!server) {
      return NextResponse.json(
        { message: "Server not found" },
        { status: 404 },
      );
    }

    const channel = await prisma.channel.findFirst({
      where: {
        id: channelId,
        serverId,
      },
    });

    if (!channel) {
      return NextResponse.json(
        { message: "Channel not found" },
        { status: 404 },
      );
    }

    const member = server.members.find((m) => m.profileId === profile.id);

    if (!member) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const message = await prisma.message.create({
      data: {
        content,
        fileUrl,
        channelId,
        memberId: member.id,
      },
      include: {
        member: {
          include: {
            profile: true,
          },
        },
      },
    });

    const channelKey = `chat:${channelId}:messages`;
    getIo().emit(channelKey, message);

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("[MESSAGES_POST]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const profile = await getCurrentProfile();
    const { searchParams } = new URL(req.url);

    const cursor = searchParams.get("cursor");
    const channelId = searchParams.get("channelId");

    if (!profile) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!channelId) {
      return NextResponse.json(
        { message: "Channel ID is required" },
        { status: 400 },
      );
    }

    let messages: Message[] = [];

    if (cursor) {
      messages = await prisma.message.findMany({
        take: MESSAGES_BATCH,
        skip: 1,
        cursor: {
          id: cursor,
        },
        where: {
          channelId,
        },
        include: {
          member: {
            include: {
              profile: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } else {
      messages = await prisma.message.findMany({
        take: MESSAGES_BATCH,
        where: {
          channelId,
        },
        include: {
          member: {
            include: {
              profile: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }

    let nextCursor = null;

    if (messages.length === MESSAGES_BATCH) {
      nextCursor = messages[MESSAGES_BATCH - 1].id;
    }

    return NextResponse.json({ items: messages, nextCursor });
  } catch (error) {
    console.error("[MESSAGES_GET]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
