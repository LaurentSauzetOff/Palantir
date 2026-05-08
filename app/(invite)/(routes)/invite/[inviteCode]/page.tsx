import { initialProfile } from "@/lib/initial-profile";
import { prisma } from "@/lib/db";
import { getIo } from "@/lib/socket-io";
import Link from "next/link";
import { redirect } from "next/navigation";

interface InviteCodePageProps {
  params: Promise<{
    inviteCode: string;
  }>;
}

const InvalidInviteView = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-100 dark:bg-zinc-900 px-4">
      <div className="w-full max-w-md rounded-xl border bg-white dark:bg-zinc-800 p-6 text-center shadow-sm">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Lien d'invitation invalide
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Ce lien est invalide, expiré, ou le serveur n'existe plus.
        </p>
        <div className="mt-5 flex items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Retour à l'accueil
          </Link>
          <Link
            href="/sign-in"
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
};

const InviteCodePage = async ({ params }: InviteCodePageProps) => {
  const { inviteCode } = await params;
  const profile = await initialProfile();

  if (!profile) {
    return redirect(`/sign-in?redirect_url=/invite/${inviteCode}`);
  }

  if (!inviteCode) {
    return <InvalidInviteView />;
  }

  const now = new Date();

  let existingServer = null;

  try {
    existingServer = await prisma.server.findFirst({
      where: {
        inviteCode: inviteCode,
        inviteCodeExpiresAt: {
          gt: now,
        },
        members: {
          some: {
            profileId: profile.id,
          },
        },
      },
    });
  } catch {
    // Fallback temporaire tant que la migration n'est pas appliquée.
    existingServer = await prisma.server.findFirst({
      where: {
        inviteCode: inviteCode,
        members: {
          some: {
            profileId: profile.id,
          },
        },
      },
    });
  }

  if (existingServer) {
    return redirect(`/servers/${existingServer.id}`);
  }

  let server = null;

  try {
    server = await prisma.server.update({
      where: {
        inviteCode,
        inviteCodeExpiresAt: {
          gt: now,
        },
      },
      data: {
        members: {
          create: [
            {
              profileId: profile.id,
            },
          ],
        },
      },
    });
  } catch {
    try {
      // Fallback temporaire tant que la migration n'est pas appliquée.
      server = await prisma.server.update({
        where: {
          inviteCode,
        },
        data: {
          members: {
            create: [
              {
                profileId: profile.id,
              },
            ],
          },
        },
      });
    } catch {
      return <InvalidInviteView />;
    }
  }

  if (server) {
    try {
      getIo().emit(`server:${server.id}:members:update`, {
        serverId: server.id,
        profileId: profile.id,
      });
    } catch {
      // Ne bloque jamais le flux d'invitation si le socket n'est pas dispo.
    }

    return redirect(`/servers/${server.id}`);
  }

  return null;
};

export default InviteCodePage;
