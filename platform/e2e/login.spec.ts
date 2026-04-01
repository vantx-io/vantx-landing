import { test, expect } from "@playwright/test";

test.describe("Login flow (TEST-06)", () => {
  // D-14: happy path — email/password -> portal redirect
  test("successful login redirects to portal", async ({ page }) => {
    await page.goto("/en/login");

    await page.getByLabel(/email/i).fill(process.env.E2E_EMAIL || "juan@novapay.com");
    await page.getByLabel(/password/i).fill(process.env.E2E_PASSWORD || "demo2026");
    await page.getByRole("button", { name: /sign in/i }).click();

    // Should redirect to portal
    await page.waitForURL("**/portal**", { timeout: 15000 });
    await expect(page).toHaveURL(/\/portal/);
  });

  // D-14: wrong password shows error message
  test("wrong password shows error message", async ({ page }) => {
    await page.goto("/en/login");

    await page.getByLabel(/email/i).fill(process.env.E2E_EMAIL || "juan@novapay.com");
    await page.getByLabel(/password/i).fill("wrong-password-123");
    await page.getByRole("button", { name: /sign in/i }).click();

    // Should stay on login page and show error — not redirect
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(/\/login/);

    // Error message should be visible — Supabase returns "Invalid login credentials"
    const errorVisible =
      (await page.locator("text=/invalid|error|incorrect/i").isVisible()) ||
      (await page.locator("[role='alert']").isVisible());
    expect(errorVisible).toBeTruthy();
  });
});
