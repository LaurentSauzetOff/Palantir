import { expect, test } from "@playwright/test";

test("redirects unauthenticated users from /servers/:id to /sign-in", async ({ page }) => {
  await page.goto("/servers/test-server-id");
  await expect(page).toHaveURL(/\/sign-in/);
});

test("shows server sidebar on desktop for an authenticated server route", async ({ page }) => {
  test.skip(
    !process.env.E2E_AUTHENTICATED_SERVER_PATH,
    "Set E2E_AUTHENTICATED_SERVER_PATH to run this test, e.g. /servers/<real-server-id>."
  );

  await page.goto(process.env.E2E_AUTHENTICATED_SERVER_PATH!);

  await expect(page.getByText("Server sidebar component")).toBeVisible();
});
