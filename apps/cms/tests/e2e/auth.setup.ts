/**
 * 어드민 로그인·MFA 1회 → storageState 저장
 *
 * 이후 chromium 프로젝트 스펙은 이 세션을 재사용하므로
 * 동일 계정 병렬 MFA 로 인한 MFA_CHALLENGE_INVALID 를 피합니다.
 */

import { test as setup, expect } from './fixtures/test'
import { LoginPage } from './pages/login.page'
import { seedMockAdminSession } from './helpers/seed-mock-admin-session'
import { E2E_ADMIN_AUTH_FILE } from './helpers/auth-paths'
import fs from 'node:fs'
import path from 'node:path'

setup('어드민 로그인·MFA 후 세션 저장', async ({ page }) => {
  setup.setTimeout(90_000)

  if (process.env.E2E_MOCK_AUTH === '1') {
    await seedMockAdminSession(page)
  } else {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.loginWithAdminAutoFillAndMfa()
  }

  await expect(page).toHaveURL('/')
  await expect(page.getByRole('heading', { name: '대시보드 홈' })).toBeVisible()

  fs.mkdirSync(path.dirname(E2E_ADMIN_AUTH_FILE), { recursive: true })
  await page.context().storageState({ path: E2E_ADMIN_AUTH_FILE })
})
