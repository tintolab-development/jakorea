import { defineConfig, devices } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isolatedPort = Number(process.env.CMS_ISOLATED_E2E_PORT ?? 3199)
const baseURL = `http://127.0.0.1:${isolatedPort}`

function buildIsolatedWebServerEnv(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env }
  delete env.CMS_BASE_URL
  delete env.E2E_BASE_URL
  delete env.E2E_API_PROXY_TARGET
  env.VITE_API_SERVER = 'http://127.0.0.1:1'
  env.VITE_DEV_PROXY_TARGET = ''
  env.VITE_NGROK_SERVER = ''
  env.VITE_API_BASE_URL = ''
  env.VITE_NGROK_SKIP_BROWSER_WARNING = ''
  env.E2E_PORT = String(isolatedPort)
  env.E2E_MOCK_AUTH = '1'
  env.CMS_ISOLATED_E2E = '1'
  return env
}

export default defineConfig({
  testDir: './tests/e2e-isolated',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  reporter: [['list']],
  timeout: 180_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL,
    trace: 'on',
    screenshot: 'on',
    video: 'retain-on-failure',
    actionTimeout: 20_000,
    navigationTimeout: 45_000,
  },
  projects: [
    {
      name: 'chromium-isolated',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `pnpm exec vite --host 127.0.0.1 --port ${isolatedPort} --strictPort`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 180_000,
    cwd: __dirname,
    env: buildIsolatedWebServerEnv(),
  },
})
