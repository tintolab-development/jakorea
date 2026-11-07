import { readJwtSidClaim } from '@jakorea/domain/session'
import { clearAdminRegisteredWizardState } from '@/features/auth/admin-registered/model/wizard-state'
import { clearInstructorApplySessionCache } from '@/features/mypage/instructor-apply/lib/instructor-apply-session-cache'
import { postPortalAuthLogout } from '@/shared/api/axios-instance'
import { clearAuthTokens, getAccessToken, getRefreshToken } from '@/shared/lib/auth-token'
import { setDevAuthLoggedIn } from '@/shared/lib/dev-auth'

export type LogoutPortalSessionOptions = {
  /** 서버 `POST /api/portal/auth/logout` 시도 여부. 기본 true */
  serverLogout?: boolean
  /** 서버 Logout에 쓸 Refresh 토큰. 생략하면 현재 저장값 */
  refreshToken?: string | null
  /** 정리 후 `window.location.assign` 할 경로. `navigate`가 있으면 무시 */
  redirectTo?: string | null
  /** SPA 이동이 필요할 때 (헤더 로그아웃 등) */
  navigate?: () => void
}

let inFlightLogout: Promise<void> | null = null

/**
 * 포털 MEMBER 세션 종료 단일 경로 — 헤더·세션 경고 모달·온보딩 종료·인증 실패 공통.
 * 1) 서버 Logout을 먼저 시도(실패해도 진행) 2) Access/Refresh·개인정보 query 캐시·Wizard·강사신청 임시상태 정리.
 * 서버 Logout 대기 중 다른 탭이 **다른 로그인 sid**로 교체했다면 그 새 세션은 지우지 않는다.
 */
export function logoutPortalSession(options: LogoutPortalSessionOptions = {}): Promise<void> {
  // 헤더·모달·인증 실패가 동시에 들어와도 서버 Logout·리다이렉트는 한 번만.
  if (inFlightLogout) return inFlightLogout
  inFlightLogout = runLogout(options).finally(() => {
    inFlightLogout = null
  })
  return inFlightLogout
}

async function runLogout(options: LogoutPortalSessionOptions): Promise<void> {
  const refreshToken =
    options.refreshToken !== undefined ? options.refreshToken : getRefreshToken()
  const sidAtStart = readJwtSidClaim(getAccessToken())

  if (options.serverLogout !== false && refreshToken) {
    try {
      await postPortalAuthLogout(refreshToken)
    } catch {
      // 서버 폐기 실패여도 로컬 세션은 정리한다.
    }
  }

  const currentRefreshToken = getRefreshToken()
  const replacedByOtherLogin =
    currentRefreshToken != null &&
    currentRefreshToken !== refreshToken &&
    readJwtSidClaim(getAccessToken()) !== sidAtStart

  if (!replacedByOtherLogin) {
    clearAuthTokens()
    clearAdminRegisteredWizardState()
    clearInstructorApplySessionCache()
    setDevAuthLoggedIn(false)
  }

  if (options.navigate) {
    options.navigate()
    return
  }
  if (options.redirectTo && typeof window !== 'undefined') {
    window.location.assign(options.redirectTo)
  }
}
