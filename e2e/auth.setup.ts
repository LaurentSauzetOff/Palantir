import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { expect, test as setup } from "@playwright/test";

const authFile = "e2e/.auth/user.json";

setup("authenticate with Clerk", async ({ page, context }) => {
  const email = process.env.E2E_CLERK_EMAIL;
  const password = process.env.E2E_CLERK_PASSWORD;

  mkdirSync(dirname(authFile), { recursive: true });

  if (!email || !password) {
    writeFileSync(authFile, JSON.stringify({ cookies: [], origins: [] }), "utf-8");
    setup.skip(
      true,
      "Set E2E_CLERK_EMAIL and E2E_CLERK_PASSWORD to run authenticated e2e scenarios.",
    );
  }

  await page.goto("/sign-in");
  await expect(page).toHaveURL(/\/sign-in/);

  // Étape 1 : saisie de l'email
  await page.getByLabel(/Email address/i).fill(email!);
  await page.getByRole("button", { name: "Continue", exact: true }).click();

  // Étape 2 : Clerk envoie un code de vérification email.
  // En mode dev Clerk, le code "424242" bypasse la vérification sans email réel.
  await page.waitForURL(/\/sign-in\/factor-one/, { timeout: 10000 });
  const otpField = page.getByRole("textbox", { name: /Enter verification code/i });
  await expect(otpField).toBeVisible({ timeout: 10000 });
  await otpField.fill("424242");
  await page.getByRole("button", { name: "Continue", exact: true }).click();

  await page.waitForURL((url) => !url.pathname.startsWith("/sign-in"), {
    timeout: 20000,
  });

  await context.storageState({ path: authFile });
});
