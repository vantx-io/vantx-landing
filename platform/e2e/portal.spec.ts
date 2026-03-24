import { test, expect } from '@playwright/test'

test('authenticated user can access portal', async ({ page }) => {
  await page.goto('/en/portal')
  await expect(page).toHaveURL(/.*portal.*/)
  await expect(page.locator('body')).not.toContainText('Sign in')
})
