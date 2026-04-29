import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("sign-in page has no critical accessibility violations", async ({ page }) => {
  await page.goto("/sign-in");

  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  const criticalViolations = accessibilityScanResults.violations.filter(
    (violation) => violation.impact === "critical"
  );

  expect(criticalViolations).toEqual([]);
});
