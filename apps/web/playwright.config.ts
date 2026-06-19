import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "on-first-retry"
  },
  webServer: {
    command: "pnpm exec vite --host 127.0.0.1 --port 4173",
    env: {
      VITE_API_URL: "http://127.0.0.1:4173/api",
      VITE_COGNITO_CLIENT_ID: "e2e-client",
      VITE_COGNITO_DOMAIN: "https://auth.example.test",
      VITE_COGNITO_USER_POOL_ID: "us-east-1_e2e",
      VITE_E2E_AUTH: "true"
    },
    reuseExistingServer: false,
    url: "http://127.0.0.1:4173"
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"]
      }
    }
  ]
});
