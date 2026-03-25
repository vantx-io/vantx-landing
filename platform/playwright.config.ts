import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  baseURL: "http://localhost:3000",
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
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
