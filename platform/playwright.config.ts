import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  baseURL: "http://localhost:3000",
  snapshotPathTemplate: "e2e/screenshots/{arg}{ext}",
  use: { trace: "on-first-retry" },
  projects: [
    { name: "setup", testMatch: /.*\.setup\.ts/ },
    {
      name: "setup-b",
      testMatch: /auth\.setup-b\.ts/,
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.auth/user.json",
      },
      dependencies: ["setup"],
    },
    {
      name: "cross-tenant",
      testMatch: /cross-tenant\.spec\.ts/,
      dependencies: ["setup", "setup-b"],
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "storage-isolation",
      testMatch: /storage-isolation\.spec\.ts/,
      dependencies: ["setup", "setup-b"],
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "visual",
      testMatch: /visual-regression\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 720 },
        storageState: "playwright/.auth/user.json",
      },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
