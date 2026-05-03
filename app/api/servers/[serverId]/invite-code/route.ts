import { getCurrentProfile } from "@/lib/current-profile";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { v4 as uuidV4 } from "uuid";

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ serverId: string }> },
) {
  try {
    const { serverId } = await params;
    const profile = await getCurrentProfile();

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!serverId) {
      return new NextResponse("Server ID is required", { status: 400 });
    }

    const updated = await prisma.server.updateMany({
      where: {
        id: serverId,
        profileId: profile.id,
      },
      data: {
        inviteCode: uuidV4(),
      },
    });

    if (updated.count === 0) {
      return new NextResponse("Server not found", { status: 404 });
    }

    const server = await prisma.server.findUnique({ where: { id: serverId } });

    return NextResponse.json(server);
  } catch (error) {
    console.error("Error generating new invite code:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
