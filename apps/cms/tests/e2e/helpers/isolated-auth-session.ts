import type { Page, Route } from '@playwright/test'

/**
 * 격리(route mock) E2E 세션 — QA-0137 이후 access token은 화면 메모리에만 있다.
 * 각 installer는 localStorage에 access token을 넣지 않고 저장된 사용자 + 전환기 refresh token
 * (`ISOLATED_E2E_REFRESH_TOKEN`)만 넣는다. 화면의 새로고침 복원 refresh(`POST …/auth/refresh`)를
 * 여기서 mock으로 답해 메모리 토큰을 받게 한다.
 */

/** 서버로 나가지 않는 JWT 모양 토큰 (TT 등 원격 capability가 mock-jwt-token을 실제 JWT로 보지 않음) */
export const ISOLATED_E2E_ACCESS_TOKEN = 'e2e.mock.header.payload'
export const ISOLATED_E2E_REFRESH_TOKEN = 'e2e.mock.refresh'

const ADMIN_REFRESH_PATH = '/api/admin/auth/refresh'
const PORTAL_REFRESH_PATH = '/api/portal/auth/refresh'

function refreshResponseBody(accessToken: string) {
  return {
    success: true,
    data: {
      accessToken,
      refreshToken: ISOLATED_E2E_REFRESH_TOKEN,
      expiresInSeconds: 3600,
    },
  }
}

/**
 * refresh mock. 기존 `**\/*` route보다 나중에 등록해야 먼저 처리된다(Playwright는 나중 등록 route 우선).
 * refresh가 아니면 기존 route로 넘긴다.
 */
export async function installIsolatedAuthRefreshRoutes(
  page: Page,
  options?: { accessToken?: string },
): Promise<void> {
  const accessToken = options?.accessToken ?? ISOLATED_E2E_ACCESS_TOKEN
  await page.route('**/api/*/auth/refresh', async (route: Route) => {
    const request = route.request()
    const { pathname } = new URL(request.url())
    if (request.method() === 'POST' && (pathname === ADMIN_REFRESH_PATH || pathname === PORTAL_REFRESH_PATH)) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(refreshResponseBody(accessToken)),
      })
      return
    }
    await route.fallback()
  })
}

/** `E2E_MOCK_AUTH=1` 세션(seedMockAdminSession)의 mock 관리자 access token — 예전에 저장하던 값과 같은 모양 */
export function mockAdminAccessToken(userId = 'mock-md-admin-171601'): string {
  return `mock-jwt-token-${userId}-${Date.now()}`
}
