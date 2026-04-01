import { test, expect } from "@playwright/test";

test.describe("Admin route protection", () => {
  test("client-role user is redirected from /admin to /portal", async ({
    page,
  }) => {
    // Navigate to admin route -- middleware should intercept
    await page.goto("/en/admin");

    // Expect redirect to portal (middleware redirects client-role to /{locale}/portal)
    await expect(page).toHaveURL(/.*\/portal.*/);
  });

  test("client-role user is redirected from /admin/clients to /portal", async ({
    page,
  }) => {
    // Also test a sub-route to confirm pathWithoutLocale.startsWith('/admin') catches all
    await page.goto("/en/admin/clients");

    await expect(page).toHaveURL(/.*\/portal.*/);
  });
});
