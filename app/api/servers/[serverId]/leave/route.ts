import { getCurrentProfile } from "@/lib/current-profile";
import { prisma } from "@/lib/db";
import { getIo } from "@/lib/socket-io";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ serverId: string }> },
) {
  try {
    const { serverId } = await params;
    const profile = await getCurrentProfile();

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!serverId) {
      return new NextResponse("Bad Request", { status: 400 });
    }

    const server = await prisma.server.update({
      where: {
        id: serverId,
        profileId: {
          not: profile.id,
        },
        members: {
          some: {
            profileId: profile.id,
          },
        },
      },
      data: {
        members: {
          deleteMany: {
            profileId: profile.id,
          },
        },
      },
    });

    try {
      getIo().emit(`server:${serverId}:members:update`, {
        serverId,
        profileId: profile.id,
        action: "leave",
      });
    } catch {
      // Ne bloque pas la mutation si socket indisponible.
    }

    return NextResponse.json(server);
  } catch (error) {
    console.log(error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
