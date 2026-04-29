import { expect, test } from "@playwright/test";

test("redirects unauthenticated users from / to /sign-in", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/sign-in/);
});
