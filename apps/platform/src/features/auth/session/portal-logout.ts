import { readJwtSidClaim } from '@jakorea/domain/session'
import { clearAdminRegisteredWizardState } from '@/features/auth/admin-registered/model/wizard-state'
import { clearInstructorApplySessionCache } from '@/features/mypage/instructor-apply/lib/instructor-apply-session-cache'
import {
  postPortalAuthLogout,
  postPortalAuthRefreshCookieLogout,
} from '@/shared/api/axios-instance'
import {
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  hasRefreshCredential,
} from '@/shared/lib/auth-token'
import { setDevAuthLoggedIn } from '@/shared/lib/dev-auth'
import { SIGN_IN_PATH } from '@/shared/lib/login-redirect'

export type LogoutPortalSessionOptions = {
  /** 서버 `POST /api/portal/auth/logout` 시도 여부. 기본 true */
  serverLogout?: boolean
  /** 서버 Logout에 쓸 Refresh 토큰. 생략하면 현재 저장값 */
  refreshToken?: string | null
  /**
   * 정리 후 `window.location.assign` 할 경로. `navigate`가 있으면 무시.
   * 로그인 화면이면 돌아올 경로(`redirect`)는 버린다 — 로그아웃·자동 로그아웃·세션 만료 뒤 다시 로그인하면 기본 첫 화면.
   */
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

  if (options.serverLogout !== false) {
    const remoteLogouts: Promise<void>[] = []
    // TODO(QA-0137 인프라 전환 후 삭제): 저장된 refreshToken이 사라지면 본문 logout 분기를 지운다.
    if (refreshToken) {
      remoteLogouts.push(
        postPortalAuthLogout(refreshToken).catch(() => {
          // 서버 폐기 실패여도 로컬 세션은 정리한다.
        }),
      )
    }
    // QA-0137: HttpOnly refresh 쿠키 폐기·삭제. best effort(내부에서 실패를 삼킴) — 로컬 정리를 막지 않는다.
    // serverLogout=false(409 회전 경쟁)면 쿠키에는 다른 탭의 최신 토큰이 있으므로 호출하지 않는다.
    if (refreshToken || hasRefreshCredential() || getAccessToken()) {
      remoteLogouts.push(postPortalAuthRefreshCookieLogout())
    }
    await Promise.all(remoteLogouts)
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
    window.location.assign(withoutSignInReturnPath(options.redirectTo))
  }
}

/** `/auth/sign-in?redirect=…` → `/auth/sign-in` (다른 쿼리는 유지). 로그인 화면이 아니면 그대로 */
export function withoutSignInReturnPath(target: string): string {
  const [beforeHash, hash] = target.split('#', 2)
  const [pathname, query] = (beforeHash ?? '').split('?', 2)
  if (pathname !== SIGN_IN_PATH || query == null) return target
  const params = new URLSearchParams(query)
  params.delete('redirect')
  const rest = params.toString()
  return `${SIGN_IN_PATH}${rest ? `?${rest}` : ''}${hash != null ? `#${hash}` : ''}`
}
