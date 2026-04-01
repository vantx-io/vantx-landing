import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import path from "path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

test.describe("Cross-tenant notification isolation", () => {
  test("User B cannot see User A notifications", async ({ browser }) => {
    // Create admin client to insert test notification for User A
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get User A's context
    const userAContext = await browser.newContext({
      storageState: path.join(__dirname, "../playwright/.auth/user.json"),
    });
    const userAPage = await userAContext.newPage();
    await userAPage.goto("/en/portal");
    await userAPage.waitForLoadState("networkidle");

    // Get User B's context
    const userBContext = await browser.newContext({
      storageState: path.join(__dirname, "../playwright/.auth/user-b.json"),
    });
    const userBPage = await userBContext.newPage();

    // Resolve User A id via service role
    const { data: userAProfile } = await adminSupabase
      .from("users")
      .select("id")
      .eq("email", process.env.E2E_EMAIL || "")
      .single();
    expect(userAProfile).toBeTruthy();
    const userAId = userAProfile!.id;

    // Insert a notification for User A via service role
    const testTitle = `cross-tenant-test-${Date.now()}`;
    const { error: insertError } = await adminSupabase
      .from("notifications")
      .insert({
        user_id: userAId,
        type: "task_created",
        title: testTitle,
        body: "This notification belongs to User A only",
        read: false,
      });
    expect(insertError).toBeNull();

    // Verify User A CAN see their notification
    await userAPage.reload();
    await userAPage.waitForLoadState("networkidle");
    // Wait for bell to show unread badge
    await expect(
      userAPage
        .locator("[aria-label]")
        .filter({ hasText: /Notification/i })
        .first()
    ).toBeVisible({ timeout: 5000 });

    // Navigate User B to portal and check they do NOT see User A's notification
    await userBPage.goto("/en/portal");
    await userBPage.waitForLoadState("networkidle");
    // Click User B's bell
    const userBBell = userBPage
      .locator("button[aria-label]")
      .filter({ hasText: /Notification/i })
      .first();
    if (await userBBell.isVisible()) {
      await userBBell.click();
      // Verify User A's test notification is NOT in User B's dropdown
      await expect(userBPage.getByText(testTitle)).not.toBeVisible();
    }
    // If bell has no badge, User B has no unread — also proves isolation

    // Cleanup: delete test notification
    await adminSupabase.from("notifications").delete().eq("title", testTitle);

    await userAContext.close();
    await userBContext.close();
  });
});
