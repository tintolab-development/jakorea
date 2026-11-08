/**
 * Portal MEMBER Activity/Session API 경계 (JABACK main `e9b5319` — MemberAuthController).
 * - `POST /api/portal/auth/activity` · `GET /api/portal/auth/session` — MEMBER Bearer(sid) 전용
 * - 관리자 `POST /api/admin/auth/activity` · `GET /api/admin/auth/session` 을 포털에서 호출하지 않는다.
 *
 * 가용성: 원격 API가 설정돼 있으면 활성. 런타임에 404(라우트 미배포)를 받으면 비활성으로 표시하고
 * 콘솔 경고를 남긴다 — 미배포를 정상 세션으로 위장하지 않는다(상태 `unavailable`).
 */
import { portalAuthPaths } from '@/features/auth/sign-in/api/endpoints'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'

export const PORTAL_SESSION_BE_CONTRACT = 'PORTAL_MEMBER_SESSION_V1' as const

export const PORTAL_SESSION_ACTIVITY_PATH = portalAuthPaths.activity()
export const PORTAL_SESSION_STATUS_PATH = portalAuthPaths.session()

let unavailableReason: string | null = null

export function isPortalSessionApiAvailable(): boolean {
  return unavailableReason == null && isRemoteApiConfigured()
}

/** 라우트 미배포(404) 등 계약 부재가 확인됐을 때만 호출한다. 네트워크·5xx로 호출하지 않는다. */
export function markPortalSessionApiUnavailable(reason: string): void {
  if (unavailableReason != null) return
  unavailableReason = reason
  console.warn(
    `[portal-session] MEMBER Session API unavailable (${reason}). ` +
      'BE 배포·프록시 경로를 확인하세요. 세션 만료 경고가 동작하지 않습니다.',
  )
}

export function getPortalSessionApiUnavailableReason(): string | null {
  return unavailableReason
}
