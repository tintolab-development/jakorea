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
const PORTAL_SESSION_PATH = '/api/portal/auth/session'
const PORTAL_ACTIVITY_PATH = '/api/portal/auth/activity'

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

/** 유휴 정책 없는 세션 상태 — 경고 모달이 뜨지 않는다 */
function sessionStatusBody() {
  const now = Date.now()
  return {
    sessionStartedAt: new Date(now - 10_000).toISOString(),
    absoluteExpiresAt: new Date(now + 12 * 3600_000).toISOString(),
    lastUserActivityAt: new Date(now).toISOString(),
    idleExpiresAt: null,
    refreshIdleExpiresAt: new Date(now + 30 * 60_000).toISOString(),
    idlePolicyEnforced: false,
    serverNow: new Date(now).toISOString(),
  }
}

/**
 * refresh mock. 기존 `**\/*` route보다 나중에 등록해야 먼저 처리된다(Playwright는 나중 등록 route 우선).
 * Platform은 복원 refresh 뒤 회원 세션(`/api/portal/auth/session`·`activity`)을 다시 조회하므로 함께 답한다.
 * 그 밖의 요청은 기존 route로 넘긴다.
 */
export async function installIsolatedAuthRefreshRoutes(
  page: Page,
  options?: { accessToken?: string },
): Promise<void> {
  const accessToken = options?.accessToken ?? ISOLATED_E2E_ACCESS_TOKEN
  await page.route(/\/api\/(admin|portal)\/auth\/(refresh|session|activity)$/, async (route: Route) => {
    const request = route.request()
    const { pathname } = new URL(request.url())
    const method = request.method()
    if (method === 'GET' && pathname === PORTAL_SESSION_PATH) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(sessionStatusBody()) })
      return
    }
    if (method === 'POST' && pathname === PORTAL_ACTIVITY_PATH) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ lastUserActivityAt: new Date().toISOString(), updated: true }),
      })
      return
    }
    if (method === 'POST' && (pathname === ADMIN_REFRESH_PATH || pathname === PORTAL_REFRESH_PATH)) {
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
