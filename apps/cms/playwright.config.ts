import { defineConfig, devices } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { E2E_ADMIN_AUTH_FILE } from './tests/e2e/helpers/auth-paths'
import { buildE2eWebServerEnv } from './tests/e2e/helpers/e2e-web-server-env'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const e2eMockAuth = process.env.E2E_MOCK_AUTH === '1'
const e2ePort = Number(process.env.E2E_PORT ?? 3000)
const baseURL = process.env.E2E_BASE_URL?.trim() || `http://127.0.0.1:${e2ePort}`
const isCI = Boolean(process.env.CI)

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL,
    // 로컬: 성공해도 UI/리포트에서 단계·화면 다시보기 가능. CI: 재시도 시에만 trace
    trace: isCI ? 'on-first-retry' : 'on',
    screenshot: isCI ? 'only-on-failure' : 'on',
    video: isCI ? 'retain-on-failure' : 'on',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'chromium',
      dependencies: ['setup'],
      testIgnore: /auth\.setup\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        /** setup 에서 저장한 어드민 JWT(localStorage) — 스펙마다 MFA 재로그인 금지 */
        storageState: E2E_ADMIN_AUTH_FILE,
      },
    },
  ],
  webServer: {
    command: e2eMockAuth ? `pnpm dev -- --port ${e2ePort}` : 'pnpm dev',
    url: baseURL,
    reuseExistingServer: !isCI && !e2eMockAuth,
    timeout: 180_000,
    cwd: __dirname,
    env: buildE2eWebServerEnv(),
  },
})
