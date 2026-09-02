import type { Page } from '@playwright/test'

/** `src/data/mock/users.ts` — admin1@jakorea.org */
const MOCK_ADMIN_USER_ID = 'mock-md-admin-171601'

/**
 * E2E mock auth — UI 로그인 없이 localStorage 세션 주입.
 * `로그인하기` 버튼은 mode=api 고정이라 BE 자격 불일치 시 setup 이 실패한다.
 */
export async function seedMockAdminSession(page: Page) {
  await page.goto('/login')
  await page.evaluate(userId => {
    const token = `mock-jwt-token-${userId}-${Date.now()}`
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    const user = {
      id: userId,
      email: 'admin1@jakorea.org',
      name: '김관리',
      role: 'ADMIN',
      adminLevel: 'MASTER',
      roleCode: 'MASTER',
      isActive: true,
      programRoles: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    localStorage.setItem('auth_token', token)
    localStorage.setItem('auth_expires_at', expiresAt)
    localStorage.setItem('auth_user', JSON.stringify(user))
  }, MOCK_ADMIN_USER_ID)

  await page.goto('/')
}
