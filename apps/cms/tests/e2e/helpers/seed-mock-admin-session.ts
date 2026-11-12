import type { Page } from '@playwright/test'
import { installIsolatedAuthRefreshRoutes, mockAdminAccessToken } from './isolated-auth-session'

/** `src/data/mock/users.ts` — admin1@jakorea.org */
const MOCK_ADMIN_USER_ID = 'mock-md-admin-171601'

/**
 * E2E mock auth — UI 로그인 없이 저장 사용자 + mock refresh token만 주입한다 (access token은 저장하지 않음).
 * 화면의 새로고침 복원 refresh는 route mock이 mock 관리자 토큰으로 답한다.
 * `로그인하기` 버튼은 mode=api 고정이라 BE 자격 불일치 시 setup 이 실패한다.
 */
export async function seedMockAdminSession(page: Page) {
  await installIsolatedAuthRefreshRoutes(page, { accessToken: mockAdminAccessToken(MOCK_ADMIN_USER_ID) })
  await page.goto('/login', { waitUntil: 'commit' })
  await page.evaluate(userId => {
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

    // QA-0137: access token은 화면 메모리에만 둔다. 백엔드 미설정(mock) 화면은 저장된 사용자만으로
    // 세션을 복원하고 mock 갱신이 새 mock 토큰을 만든다 (auth-store canRestoreSessionWithoutAccessToken).
    localStorage.removeItem('auth_token')
    localStorage.setItem('auth_user', JSON.stringify(user))
    // 백엔드가 설정된 화면은 refresh 수단이 있어야 복원한다 — 복원 refresh는 installIsolatedAuthRefreshRoutes가 답한다
    localStorage.setItem('auth_refresh_token', 'e2e.mock.refresh')
  }, MOCK_ADMIN_USER_ID)

  await page.goto('/', { waitUntil: 'commit' })
}
