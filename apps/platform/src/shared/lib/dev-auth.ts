import { isAdminOnboardingRequired } from './admin-onboarding-session'
import { PLATFORM_AUTH_TOKEN_KEY } from './auth-token'

const DEV_AUTH_STORAGE_KEY = 'platform:dev:is-logged-in'
export const DEV_AUTH_CHANGE_EVENT = 'platform:dev-auth-change'

export function getDevAuthLoggedIn() {
  if (typeof window === 'undefined') return false
  // 관리자 등록 온보딩 미완료: 토큰이 있어도 정상 로그인 UI로 취급하지 않음
  if (isAdminOnboardingRequired()) return false
  // 실로그인 토큰이 있으면 로그인으로 간주 (헤더·마이페이지 가드 호환)
  if (window.localStorage.getItem(PLATFORM_AUTH_TOKEN_KEY)) return true
  return window.localStorage.getItem(DEV_AUTH_STORAGE_KEY) === 'true'
}

export function setDevAuthLoggedIn(isLoggedIn: boolean) {
  if (isLoggedIn) {
    window.localStorage.setItem(DEV_AUTH_STORAGE_KEY, 'true')
  } else {
    window.localStorage.removeItem(DEV_AUTH_STORAGE_KEY)
  }

  window.dispatchEvent(
    new CustomEvent(DEV_AUTH_CHANGE_EVENT, {
      detail: { isLoggedIn },
    }),
  )
}
