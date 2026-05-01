// @vitest-environment jsdom

import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ServerHeader } from "@/components/server/server-header";
import { MemberRole } from "@/lib/generated/prisma/enums";
import type { ServerWithMembersWithProfiles } from "@/types";

const mockServer = {
  id: "server-1",
  name: "Palantir",
  imageURL: "https://example.com/image.png",
  inviteCode: "abc123",
  profileId: "profile-1",
  createdAt: new Date(),
  updatedAt: new Date(),
  members: [],
  channels: [],
} as unknown as ServerWithMembersWithProfiles;

const openDropdown = async () => {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: /Palantir/i }));
  return user;
};

describe("ServerHeader — affichage du trigger", () => {
  it("affiche le nom du serveur dans le bouton", () => {
    render(<ServerHeader server={mockServer} role={MemberRole.GUEST} />);
    expect(screen.getByRole("button", { name: /Palantir/i })).toBeInTheDocument();
  });
});

describe("ServerHeader — rôle GUEST", () => {
  beforeEach(() => {
    render(<ServerHeader server={mockServer} role={MemberRole.GUEST} />);
  });

  it("affiche Leave Server", async () => {
    await openDropdown();
    expect(screen.getByText("Leave Server")).toBeInTheDocument();
  });

  it("n'affiche pas les actions modérateur", async () => {
    await openDropdown();
    expect(screen.queryByText("Invite People")).not.toBeInTheDocument();
    expect(screen.queryByText("Create Channel")).not.toBeInTheDocument();
  });

  it("n'affiche pas les actions admin", async () => {
    await openDropdown();
    expect(screen.queryByText("Server settings")).not.toBeInTheDocument();
    expect(screen.queryByText("Manage members")).not.toBeInTheDocument();
    expect(screen.queryByText("Delete Server")).not.toBeInTheDocument();
  });
});

describe("ServerHeader — rôle MODERATOR", () => {
  beforeEach(() => {
    render(<ServerHeader server={mockServer} role={MemberRole.MODERATOR} />);
  });

  it("affiche les actions modérateur", async () => {
    await openDropdown();
    expect(screen.getByText("Invite People")).toBeInTheDocument();
    expect(screen.getByText("Create Channel")).toBeInTheDocument();
  });

  it("affiche Leave Server (n'est pas admin)", async () => {
    await openDropdown();
    expect(screen.getByText("Leave Server")).toBeInTheDocument();
  });

  it("n'affiche pas les actions réservées admin", async () => {
    await openDropdown();
    expect(screen.queryByText("Server settings")).not.toBeInTheDocument();
    expect(screen.queryByText("Manage members")).not.toBeInTheDocument();
    expect(screen.queryByText("Delete Server")).not.toBeInTheDocument();
  });
});

describe("ServerHeader — rôle ADMIN", () => {
  beforeEach(() => {
    render(<ServerHeader server={mockServer} role={MemberRole.ADMIN} />);
  });

  it("affiche toutes les actions modérateur", async () => {
    await openDropdown();
    expect(screen.getByText("Invite People")).toBeInTheDocument();
    expect(screen.getByText("Create Channel")).toBeInTheDocument();
  });

  it("affiche les actions exclusivement admin", async () => {
    await openDropdown();
    expect(screen.getByText("Server settings")).toBeInTheDocument();
    expect(screen.getByText("Manage members")).toBeInTheDocument();
    expect(screen.getByText("Delete Server")).toBeInTheDocument();
  });

  it("n'affiche pas Leave Server", async () => {
    await openDropdown();
    expect(screen.queryByText("Leave Server")).not.toBeInTheDocument();
  });
});
