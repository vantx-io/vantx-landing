import { test, expect } from "@playwright/test";
import path from "path";

test.describe("Task CRUD with attachment (TEST-07)", () => {
  test("full task lifecycle: create, edit title, change status, comment with attachment (D-15)", async ({
    page,
  }) => {
    const testTitle = `E2E-Task-${Date.now()}`;
    const editedTitle = `${testTitle}-EDITED`;

    // Navigate to tasks page
    await page.goto("/en/portal/tasks");
    await page.waitForLoadState("networkidle");

    // -- Step 1: Create a new task --
    await page.getByRole("button", { name: /new request/i }).click();

    // Fill task form
    await page.getByPlaceholder(/title/i).fill(testTitle);
    await page.getByPlaceholder(/description/i).fill("E2E test task description");
    await page.getByRole("button", { name: /create/i }).click();

    // Wait for task to appear in list
    await expect(page.getByText(testTitle)).toBeVisible({ timeout: 10000 });

    // -- Step 2: Edit the task title (per D-15) --
    // Click the task title to enter inline edit mode
    await page.getByText(testTitle).click();
    // The title becomes an input field with aria-label matching "Edit title"
    const titleInput = page.getByLabel(/edit title/i);
    await expect(titleInput).toBeVisible({ timeout: 5000 });
    await titleInput.clear();
    await titleInput.fill(editedTitle);
    // Press Enter to save
    await titleInput.press("Enter");

    // Wait for the edited title to persist and appear in the list
    await expect(page.getByText(editedTitle)).toBeVisible({ timeout: 10000 });

    // -- Step 3: Expand the task to see comments + status dropdown --
    // Click the task row (using the edited title) to expand
    await page.getByText(editedTitle).click();
    await page.waitForLoadState("networkidle");

    // -- Step 4: Change the task status (per D-15) --
    const statusDropdown = page.getByLabel(/change status/i);
    await expect(statusDropdown).toBeVisible({ timeout: 5000 });
    await statusDropdown.selectOption("in_progress");

    // Verify the status badge updates to show "IN PROGRESS"
    await expect(page.getByText("IN PROGRESS")).toBeVisible({ timeout: 10000 });

    // -- Step 5: Add comment with file attachment (per D-15) --
    // Trigger file chooser via paperclip/attach button
    const [fileChooser] = await Promise.all([
      page.waitForEvent("filechooser"),
      page.getByRole("button", { name: /attach/i }).click(),
    ]);
    await fileChooser.setFiles(path.join(__dirname, "fixtures/test.txt"));

    // Verify file appears in preview strip
    await expect(page.getByText("test.txt")).toBeVisible({ timeout: 5000 });

    // Type comment content
    await page.getByPlaceholder(/write a comment|escribe/i).fill("E2E test comment with attachment");

    // Click send
    await page.getByRole("button", { name: /send/i }).click();

    // Wait for comment to appear in thread
    await expect(page.getByText("E2E test comment with attachment")).toBeVisible({
      timeout: 15000,
    });

    // Verify attachment appears in the comment thread (filename visible)
    await expect(page.getByText("test.txt").first()).toBeVisible({ timeout: 10000 });
  });

  test("can attach image and see thumbnail", async ({ page }) => {
    const testTitle = `E2E-ImgTask-${Date.now()}`;

    await page.goto("/en/portal/tasks");
    await page.waitForLoadState("networkidle");

    // Create task
    await page.getByRole("button", { name: /new request/i }).click();
    await page.getByPlaceholder(/title/i).fill(testTitle);
    await page.getByRole("button", { name: /create/i }).click();
    await expect(page.getByText(testTitle)).toBeVisible({ timeout: 10000 });

    // Expand task
    await page.getByText(testTitle).click();
    await page.waitForLoadState("networkidle");

    // Attach image
    const [fileChooser] = await Promise.all([
      page.waitForEvent("filechooser"),
      page.getByRole("button", { name: /attach/i }).click(),
    ]);
    await fileChooser.setFiles(path.join(__dirname, "fixtures/test.png"));

    // Type comment and send
    await page.getByPlaceholder(/write a comment|escribe/i).fill("Image attachment test");
    await page.getByRole("button", { name: /send/i }).click();

    // Wait for comment to appear
    await expect(page.getByText("Image attachment test")).toBeVisible({ timeout: 15000 });

    // Verify image thumbnail renders (120x120 element with img tag)
    const thumbnail = page
      .locator("img[alt*='test.png'], img[alt*='Attachment']")
      .first();
    await expect(thumbnail).toBeVisible({ timeout: 10000 });
  });
});
