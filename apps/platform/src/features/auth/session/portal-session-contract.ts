/**
 * Portal Activity/Session API 경계.
 * 관리자 `POST /api/admin/auth/activity` · `GET /api/admin/auth/session` 을 포털에서 호출하지 않는다.
 *
 * 현재 OpenAPI·포털 인증 경로에 Activity/Session이 없어 서버 연장을 연결하지 않는다.
 * BLOCKED_BY_PORTAL_BE_CONTRACT
 */
export const PORTAL_SESSION_BE_CONTRACT = 'BLOCKED_BY_PORTAL_BE_CONTRACT' as const

export const PORTAL_SESSION_ACTIVITY_PATH = '/api/portal/auth/activity'
export const PORTAL_SESSION_STATUS_PATH = '/api/portal/auth/session'

export function isPortalSessionApiAvailable(): boolean {
  return false
}
