import { test as setup } from '@playwright/test'
import path from 'path'

const authFile = path.join(__dirname, '../playwright/.auth/user.json')

setup('authenticate', async ({ page }) => {
  await page.goto('/en/login')
  await page.getByLabel(/email/i).fill(process.env.E2E_EMAIL || 'juan@novapay.com')
  await page.getByLabel(/password/i).fill(process.env.E2E_PASSWORD || 'demo2026')
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.waitForURL('**/portal**')
  await page.context().storageState({ path: authFile })
})
