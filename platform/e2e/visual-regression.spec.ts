import { test, expect } from '@playwright/test'

// D-10: Desktop only, 1280x720
test.use({ viewport: { width: 1280, height: 720 } })

// Helper to mask dynamic content before screenshot (D-11)
async function maskDynamicContent(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    // Mask all date/time elements with data-testid="timestamp" or common date patterns
    // Freeze any visible relative time strings (e.g., "2 hours ago")
    document.querySelectorAll('time, [data-testid="timestamp"]').forEach(el => {
      ;(el as HTMLElement).textContent = '2026-01-01'
    })
  })
}

test.describe('Portal pages', () => {
  test('portal dashboard', async ({ page }) => {
    await page.goto('/en/portal')
    await page.waitForLoadState('networkidle')
    await maskDynamicContent(page)
    await expect(page).toHaveScreenshot('portal-dashboard.png', {
      maxDiffPixelRatio: 0.01,
      animations: 'disabled',
    })
  })

  test('task list', async ({ page }) => {
    await page.goto('/en/portal/tasks')
    await page.waitForLoadState('networkidle')
    await maskDynamicContent(page)
    await expect(page).toHaveScreenshot('task-list.png', {
      maxDiffPixelRatio: 0.01,
      animations: 'disabled',
    })
  })

  test('settings', async ({ page }) => {
    await page.goto('/en/portal/settings')
    await page.waitForLoadState('networkidle')
    await maskDynamicContent(page)
    await expect(page).toHaveScreenshot('settings.png', {
      maxDiffPixelRatio: 0.01,
      animations: 'disabled',
    })
  })
})

test.describe('Admin pages', () => {
  test('admin overview', async ({ page }) => {
    await page.goto('/en/admin')
    await page.waitForLoadState('networkidle')
    await maskDynamicContent(page)
    await expect(page).toHaveScreenshot('admin-overview.png', {
      maxDiffPixelRatio: 0.01,
      animations: 'disabled',
    })
  })

  test('admin billing', async ({ page }) => {
    await page.goto('/en/admin/billing')
    await page.waitForLoadState('networkidle')
    await maskDynamicContent(page)
    await expect(page).toHaveScreenshot('admin-billing.png', {
      maxDiffPixelRatio: 0.01,
      animations: 'disabled',
    })
  })

  test('admin users', async ({ page }) => {
    await page.goto('/en/admin/users')
    await page.waitForLoadState('networkidle')
    await maskDynamicContent(page)
    await expect(page).toHaveScreenshot('admin-users.png', {
      maxDiffPixelRatio: 0.01,
      animations: 'disabled',
    })
  })
})
