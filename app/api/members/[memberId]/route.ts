import { getCurrentProfile } from "@/lib/current-profile";
import { prisma } from "@/lib/db";
import { getIo } from "@/lib/socket-io";
import { NextResponse } from "next/server";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ memberId: string }> },
) {
  try {
    const { memberId } = await params;
    const profile = await getCurrentProfile();
    const { searchParams } = new URL(req.url);

    const serverId = searchParams.get("serverId");

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!serverId) {
      return new NextResponse("Server ID is required", { status: 400 });
    }

    if (!memberId) {
      return new NextResponse("Member ID is required", { status: 400 });
    }

    const server = await prisma.server.update({
      where: {
        id: serverId,
        profileId: profile.id,
      },
      data: {
        members: {
          deleteMany: {
            id: memberId,
            profileId: {
              not: profile.id,
            },
          },
        },
      },
      include: {
        members: {
          include: {
            profile: true,
          },
          orderBy: {
            role: "asc",
          },
        },
      },
    });

    try {
      getIo().emit(`server:${serverId}:members:update`, {
        serverId,
        memberId,
        action: "delete",
      });
    } catch {
      // Ne bloque pas la mutation si socket indisponible.
    }

    return NextResponse.json(server);
  } catch (error) {
    console.error("Error deleting member:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ memberId: string }> },
) {
  try {
    const { memberId } = await params;
    const profile = await getCurrentProfile();
    const { searchParams } = new URL(req.url);
    const { role } = await req.json();

    const serverId = searchParams.get("serverId");

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!serverId) {
      return new NextResponse("Server ID is required", { status: 400 });
    }

    if (!memberId) {
      return new NextResponse("Member ID is required", { status: 400 });
    }

    const server = await prisma.server.update({
      where: {
        id: serverId,
        profileId: profile.id,
      },
      data: {
        members: {
          update: {
            where: {
              id: memberId,
              profileId: {
                not: profile.id,
              },
            },
            data: {
              role,
            },
          },
        },
      },
      include: {
        members: {
          include: {
            profile: true,
          },
          orderBy: {
            role: "asc",
          },
        },
      },
    });

    try {
      getIo().emit(`server:${serverId}:members:update`, {
        serverId,
        memberId,
        action: "role-update",
      });
    } catch {
      // Ne bloque pas la mutation si socket indisponible.
    }

    return NextResponse.json(server);
  } catch (error) {
    console.error("Error updating member role:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
