import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentProfileMock: vi.fn(),
  findUniqueMock: vi.fn(),
  redirectMock: vi.fn((path: string) => ({ redirectedTo: path })),
}));

vi.mock("@/lib/current-profile", () => ({
  getCurrentProfile: mocks.getCurrentProfileMock,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    server: {
      findUnique: mocks.findUniqueMock,
    },
  },
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirectMock,
}));

vi.mock("@/lib/generated/prisma/client", () => ({
  ChannelType: {
    TEXT: "TEXT",
    AUDIO: "AUDIO",
    VIDEO: "VIDEO",
  },
}));

vi.mock("@/components/server/server-header", () => ({
  ServerHeader: (props: Record<string, unknown>) =>
    React.createElement("mock-server-header", props),
}));

import { MemberRole } from "@/lib/generated/prisma/enums";
import { ServerSidebar } from "@/components/server/server-sidebar";

describe("ServerSidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirige vers / quand il n'y a pas de profil", async () => {
    mocks.getCurrentProfileMock.mockResolvedValue(null);

    const result = await ServerSidebar({ serverId: "server-1" });

    expect(mocks.redirectMock).toHaveBeenCalledWith("/");
    expect(mocks.findUniqueMock).not.toHaveBeenCalled();
    expect(result).toEqual({ redirectedTo: "/" });
  });

  it("redirige vers / quand le serveur est introuvable", async () => {
    mocks.getCurrentProfileMock.mockResolvedValue({ id: "profile-1" });
    mocks.findUniqueMock.mockResolvedValue(null);

    const result = await ServerSidebar({ serverId: "server-1" });

    expect(mocks.findUniqueMock).toHaveBeenCalledWith({
      where: {
        id: "server-1",
        members: {
          some: {
            profileId: "profile-1",
          },
        },
      },
      include: {
        channels: { orderBy: { createdAt: "asc" } },
        members: {
          include: { profile: true },
          orderBy: { role: "asc" },
        },
      },
    });
    expect(mocks.redirectMock).toHaveBeenCalledWith("/");
    expect(result).toEqual({ redirectedTo: "/" });
  });

  it("rend la sidebar et transmet le role du membre courant au header", async () => {
    mocks.getCurrentProfileMock.mockResolvedValue({ id: "profile-1" });
    mocks.findUniqueMock.mockResolvedValue({
      id: "server-1",
      name: "Palantir",
      imageURL: "https://example.com/image.png",
      inviteCode: "invite-code",
      profileId: "profile-owner",
      createdAt: new Date(),
      updatedAt: new Date(),
      channels: [
        { id: "c1", type: "TEXT" },
        { id: "c2", type: "AUDIO" },
        { id: "c3", type: "VIDEO" },
      ],
      members: [
        { profileId: "profile-1", role: MemberRole.MODERATOR, profile: { id: "profile-1" } },
        { profileId: "profile-2", role: MemberRole.GUEST, profile: { id: "profile-2" } },
      ],
    });

    const tree = (await ServerSidebar({
      serverId: "server-1",
    })) as React.ReactElement<{ children: React.ReactElement<Record<string, unknown>> }>;

    expect(mocks.redirectMock).not.toHaveBeenCalled();
    expect(tree.type).toBe("div");

    const children = React.Children.toArray(tree.props.children) as React.ReactElement[];
    const header = children.find((child) => "role" in (child.props ?? {}));

    expect(header).toBeDefined();
    expect(header?.props.role).toBe(MemberRole.MODERATOR);
    expect((header?.props.server as { name: string }).name).toBe("Palantir");
  });

  it("redirige vers / quand le profil n'est pas membre du serveur", async () => {
    mocks.getCurrentProfileMock.mockResolvedValue({ id: "profile-outside" });
    mocks.findUniqueMock.mockResolvedValue(null);

    const result = await ServerSidebar({ serverId: "server-1" });

    expect(mocks.findUniqueMock).toHaveBeenCalledWith({
      where: {
        id: "server-1",
        members: {
          some: {
            profileId: "profile-outside",
          },
        },
      },
      include: {
        channels: { orderBy: { createdAt: "asc" } },
        members: {
          include: { profile: true },
          orderBy: { role: "asc" },
        },
      },
    });
    expect(mocks.redirectMock).toHaveBeenCalledWith("/");
    expect(result).toEqual({ redirectedTo: "/" });
  });
});
