import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  currentUserMock: vi.fn(),
  findUniqueMock: vi.fn(),
  createMock: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  currentUser: mocks.currentUserMock,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    profile: {
      findUnique: mocks.findUniqueMock,
      create: mocks.createMock,
    },
  },
}));

import { initialProfile } from "@/lib/initial-profile";

describe("initialProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when there is no authenticated user", async () => {
    mocks.currentUserMock.mockResolvedValue(null);

    const result = await initialProfile();

    expect(result).toBeNull();
    expect(mocks.findUniqueMock).not.toHaveBeenCalled();
    expect(mocks.createMock).not.toHaveBeenCalled();
  });

  it("creates a profile when user exists and no profile is found", async () => {
    mocks.currentUserMock.mockResolvedValue({
      id: "user_123",
      firstName: "Ada",
      lastName: "Lovelace",
      username: "adal",
      imageUrl: "https://example.com/avatar.png",
      emailAddresses: [{ emailAddress: "ada@example.com" }],
    });
    mocks.findUniqueMock.mockResolvedValue(null);
    mocks.createMock.mockResolvedValue({ id: "profile_123", userId: "user_123" });

    const result = await initialProfile();

    expect(mocks.findUniqueMock).toHaveBeenCalledWith({
      where: { userId: "user_123" },
    });
    expect(mocks.createMock).toHaveBeenCalledWith({
      data: {
        userId: "user_123",
        name: "Ada Lovelace",
        imageUrl: "https://example.com/avatar.png",
        email: "ada@example.com",
      },
    });
    expect(result).toEqual({ id: "profile_123", userId: "user_123" });
  });
});
