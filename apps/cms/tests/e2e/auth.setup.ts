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
    await loginPage.loginWithAdminAutoFillAndMfa(process.env.E2E_MFA_CODE)
  }

  await expect(page).toHaveURL('/')
  await expect(page.getByRole('heading', { name: '대시보드 홈' })).toBeVisible()
  // 로그인 응답의 레거시 세션 roleCode가 VIEWER로 남아 있는 동안에는
  // 프로그램 생성 버튼을 눌러도 프론트 권한 가드가 먼저 차단한다.
  // GET /api/admin/me가 반환한 MASTER 권한이 세션에 반영될 때까지 기다린다.
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          try {
            const user = JSON.parse(localStorage.getItem('auth_user') ?? 'null') as {
              roleCode?: string
            } | null
            return user?.roleCode ?? null
          } catch {
            return null
          }
        }),
      { timeout: 30_000 }
    )
    .toBe('MASTER')

  fs.mkdirSync(path.dirname(E2E_ADMIN_AUTH_FILE), { recursive: true })
  await page.context().storageState({ path: E2E_ADMIN_AUTH_FILE })
})
