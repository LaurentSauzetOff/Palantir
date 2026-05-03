import { expect, test } from "@playwright/test";

const authenticatedServerPath = process.env.E2E_AUTHENTICATED_SERVER_PATH;
const expectedRole = process.env.E2E_EXPECTED_ROLE ?? "GUEST";
const hasAuthCredentials = Boolean(
  process.env.E2E_CLERK_EMAIL && process.env.E2E_CLERK_PASSWORD,
);

const shouldRunAuthenticatedScenarios = Boolean(
  authenticatedServerPath && hasAuthCredentials,
);

test("redirects unauthenticated users from /servers/:id to /sign-in", async ({ page }) => {
  await page.goto("/servers/test-server-id");
  await expect(page).toHaveURL(/\/sign-in/);
});

test.describe("authenticated server route", () => {
  test.skip(
    !shouldRunAuthenticatedScenarios,
    "Set E2E_AUTHENTICATED_SERVER_PATH, E2E_CLERK_EMAIL and E2E_CLERK_PASSWORD to run authenticated role checks.",
  );

  test("enforces minimal actions for GUEST and role-based menu visibility", async ({
    page,
  }) => {
    await page.goto(authenticatedServerPath!);
    await expect(page).not.toHaveURL(/\/sign-in/);

    const serverMenuButton = page.getByRole("button").first();
    await expect(serverMenuButton).toBeVisible();
    await serverMenuButton.click();

    if (expectedRole === "GUEST") {
      await expect(page.getByText("Leave Server")).toBeVisible();
      await expect(page.getByText("Invite People")).toHaveCount(0);
      await expect(page.getByText("Create Channel")).toHaveCount(0);
      await expect(page.getByText("Server settings")).toHaveCount(0);
      await expect(page.getByText("Manage members")).toHaveCount(0);
      await expect(page.getByText("Delete Server")).toHaveCount(0);
      return;
    }

    if (expectedRole === "MODERATOR") {
      await expect(page.getByText("Invite People")).toBeVisible();
      await expect(page.getByText("Create Channel")).toBeVisible();
      await expect(page.getByText("Leave Server")).toBeVisible();
      await expect(page.getByText("Server settings")).toHaveCount(0);
      await expect(page.getByText("Manage members")).toHaveCount(0);
      await expect(page.getByText("Delete Server")).toHaveCount(0);
      return;
    }

    await expect(page.getByText("Invite People")).toBeVisible();
    await expect(page.getByText("Create Channel")).toBeVisible();
    await expect(page.getByText("Server settings")).toBeVisible();
    await expect(page.getByText("Manage members")).toBeVisible();
    await expect(page.getByText("Delete Server")).toBeVisible();
    await expect(page.getByText("Leave Server")).toHaveCount(0);
  });
});
