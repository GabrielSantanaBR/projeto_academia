import "dotenv/config";
import { defineConfig, devices } from "@playwright/test";

const database = process.env.TEST_DATABASE_URL;
if (!database || !new URL(database).pathname.includes("test")) {
  throw new Error("Defina TEST_DATABASE_URL para um banco descartável com test no nome.");
}
process.env.DATABASE_URL = database;
export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./tests/e2e/setup.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: { baseURL: "http://127.0.0.1:3000", trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1000 } } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "npm start",
    url: "http://127.0.0.1:3000/api/health",
    reuseExistingServer: false,
    timeout: 120_000,
    env: { DATABASE_URL: database, NEXTAUTH_URL: "http://127.0.0.1:3000", NEXTAUTH_SECRET: "browser-test-only-secret-do-not-use-in-production-123456", NODE_ENV: "production", DEMO_MODE: "false", ALLOW_DEMO_SEED: "false", NEXT_TELEMETRY_DISABLED: "1", PORT: "3000" },
  },
});
