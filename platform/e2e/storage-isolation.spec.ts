import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import path from "path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

test.describe("Cross-tenant storage isolation (D-16)", () => {
  test("User B cannot access User A file attachments", async ({ browser }) => {
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

    // -- Resolve User A and their client_id --
    const { data: userAProfile } = await adminSupabase
      .from("users")
      .select("id, client_id")
      .eq("email", process.env.E2E_EMAIL || "juan@novapay.com")
      .single();
    expect(userAProfile).toBeTruthy();
    const userAClientId = userAProfile!.client_id;
    expect(userAClientId).toBeTruthy();

    // -- Upload a test file to User A's storage path via service role --
    const testFileName = `isolation-test-${Date.now()}.txt`;
    const storagePath = `${userAClientId}/test-task/${testFileName}`;
    const fileContent = Buffer.from("Cross-tenant isolation test content");

    const { error: uploadError } = await adminSupabase.storage
      .from("task-attachments")
      .upload(storagePath, fileContent, {
        contentType: "text/plain",
        upsert: false,
      });
    expect(uploadError).toBeNull();

    // -- User A context: can generate signed URL and access file --
    const userAContext = await browser.newContext({
      storageState: path.join(__dirname, "../playwright/.auth/user.json"),
    });
    const userAPage = await userAContext.newPage();
    await userAPage.goto("/en/portal");
    await userAPage.waitForLoadState("networkidle");

    // User A should be able to get a signed URL via REST API with their session token
    const userAResult = await userAPage.evaluate(
      async ({ storagePath, supabaseUrl }) => {
        const res = await fetch(
          `${supabaseUrl}/storage/v1/object/sign/task-attachments/${storagePath}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ expiresIn: 60 }),
            credentials: "include",
          }
        );
        return { status: res.status, ok: res.ok };
      },
      { storagePath, supabaseUrl }
    );
    expect(userAResult.ok).toBeTruthy();

    // -- User B context: cannot access User A's file --
    const userBContext = await browser.newContext({
      storageState: path.join(__dirname, "../playwright/.auth/user-b.json"),
    });
    const userBPage = await userBContext.newPage();
    await userBPage.goto("/en/portal");
    await userBPage.waitForLoadState("networkidle");

    // User B should NOT be able to get a signed URL for User A's file
    const userBResult = await userBPage.evaluate(
      async ({ storagePath, supabaseUrl }) => {
        const res = await fetch(
          `${supabaseUrl}/storage/v1/object/sign/task-attachments/${storagePath}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ expiresIn: 60 }),
            credentials: "include",
          }
        );
        return { status: res.status, ok: res.ok };
      },
      { storagePath, supabaseUrl }
    );
    // User B should get an error — RLS blocks cross-tenant access
    expect(userBResult.ok).toBeFalsy();

    // -- Cleanup --
    await adminSupabase.storage.from("task-attachments").remove([storagePath]);

    await userAContext.close();
    await userBContext.close();
  });
});
