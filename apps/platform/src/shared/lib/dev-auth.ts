import { isAdminOnboardingRequired } from './admin-onboarding-session'
import { isRemoteApiConfigured } from './api-remote-env'
import { getAccessToken, PLATFORM_AUTH_TOKEN_KEY } from './auth-token'
import { DEV_AUTH_CHANGE_EVENT, emitDevAuthChange } from './auth-session-event'

const DEV_AUTH_STORAGE_KEY = 'platform:dev:is-logged-in'
export { DEV_AUTH_CHANGE_EVENT }

export function getDevAuthLoggedIn() {
  if (typeof window === 'undefined') return false
  // 관리자 등록 온보딩 미완료: 토큰이 있어도 정상 로그인 UI로 취급하지 않음
  if (isAdminOnboardingRequired()) return false
  // 실로그인 토큰이 있으면 로그인으로 간주 (헤더·마이페이지 가드 호환)
  if (window.localStorage.getItem(PLATFORM_AUTH_TOKEN_KEY)) return true
  return window.localStorage.getItem(DEV_AUTH_STORAGE_KEY) === 'true'
}

/**
 * Platform mock 카탈로그를 쓸지.
 * remote API + access token(실세션)이면 false — 비로그인·mock 로그인은 true.
 * `getDevAuthLoggedIn()`은 토큰이 있어도 true라서 데이터 소스 가드로 쓰지 않는다.
 */
export function shouldUsePlatformMockData(): boolean {
  if (typeof window === 'undefined') return true
  return !(isRemoteApiConfigured() && Boolean(getAccessToken()))
}

export function withPlatformMockData<T>(value: T, empty: T): T {
  return shouldUsePlatformMockData() ? value : empty
}

export function setDevAuthLoggedIn(isLoggedIn: boolean) {
  if (typeof window === 'undefined') return
  if (isLoggedIn) {
    window.localStorage.setItem(DEV_AUTH_STORAGE_KEY, 'true')
  } else {
    window.localStorage.removeItem(DEV_AUTH_STORAGE_KEY)
  }

  emitDevAuthChange(getDevAuthLoggedIn())
}
