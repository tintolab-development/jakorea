import { defineConfig, devices } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const cmsPort = Number(process.env.CMS_CS_ISOLATED_E2E_PORT ?? 3177)
const platformPort = Number(process.env.PLATFORM_CS_ISOLATED_E2E_PORT ?? 3277)
const cmsURL = `http://127.0.0.1:${cmsPort}`
const platformURL = `http://127.0.0.1:${platformPort}`
const platformRoot = path.resolve(__dirname, '../platform')

function assertNoExternalProxy(): void {
  const suspects = [
    process.env.E2E_API_PROXY_TARGET,
    process.env.CMS_API_PROXY_TARGET,
    process.env.VITE_NGROK_SERVER,
  ]
  for (const value of suspects) {
    const trimmed = value?.trim() ?? ''
    if (!trimmed) continue
    if (!/127\.0\.0\.1|localhost/.test(trimmed)) {
      throw new Error(`CS isolated E2E refuses external proxy: ${trimmed}`)
    }
  }
}

assertNoExternalProxy()

function stripLiveApiEnv(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const next: NodeJS.ProcessEnv = { ...env }
  delete next.CMS_BASE_URL
  delete next.E2E_BASE_URL
  delete next.E2E_API_PROXY_TARGET
  delete next.CMS_API_PROXY_TARGET
  next.VITE_API_SERVER = 'http://127.0.0.1:1'
  next.VITE_DEV_PROXY_TARGET = ''
  next.VITE_NGROK_SERVER = ''
  next.VITE_API_BASE_URL = ''
  next.VITE_NGROK_SKIP_BROWSER_WARNING = ''
  next.VITE_HOMEPAGE_API_SERVER = 'http://127.0.0.1:1'
  next.VITE_COMPANY_SCHOOL_PROGRAMS_REMOTE_ENABLED = 'true'
  next.E2E_MOCK_AUTH = '1'
  next.CMS_ISOLATED_E2E = '1'
  return next
}

export default defineConfig({
  testDir: './tests/e2e-company-school-isolated',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  reporter: [['list']],
  timeout: 180_000,
  expect: { timeout: 20_000 },
  use: {
    baseURL: cmsURL,
    trace: 'on',
    screenshot: 'on',
    video: 'retain-on-failure',
    actionTimeout: 20_000,
    navigationTimeout: 45_000,
    serviceWorkers: 'block',
  },
  projects: [
    {
      name: 'chromium-cs-isolated',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: cmsURL,
      },
    },
  ],
  webServer: [
    {
      command: `pnpm exec vite --host 127.0.0.1 --port ${cmsPort} --strictPort`,
      url: cmsURL,
      reuseExistingServer: false,
      timeout: 180_000,
      cwd: __dirname,
      env: {
        ...stripLiveApiEnv(process.env),
        E2E_PORT: String(cmsPort),
      },
    },
    {
      command: `pnpm exec vite --host 127.0.0.1 --port ${platformPort} --strictPort`,
      url: platformURL,
      reuseExistingServer: false,
      timeout: 180_000,
      cwd: platformRoot,
      env: {
        ...stripLiveApiEnv(process.env),
        E2E_PORT: String(platformPort),
      },
    },
  ],
  metadata: {
    platformURL,
  },
})
