import { test as setup } from "@playwright/test";
import path from "path";

const authFile = path.join(__dirname, "../playwright/.auth/user-b.json");

setup("authenticate user-b", async ({ page }) => {
  await page.goto("/en/login");
  await page.getByLabel(/email/i).fill(process.env.E2E_EMAIL_B || "");
  await page.getByLabel(/password/i).fill(process.env.E2E_PASSWORD_B || "");
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL("**/portal**");
  await page.context().storageState({ path: authFile });
});
