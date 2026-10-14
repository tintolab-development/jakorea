import { isAdminOnboardingRequired } from './admin-onboarding-session'
import { PLATFORM_AUTH_TOKEN_KEY } from './auth-token'
import { DEV_AUTH_CHANGE_EVENT, emitDevAuthChange } from './auth-session-event'

/** @deprecated mock 로그인 제거 — 로그아웃 시 레거시 키만 정리 */
const DEV_AUTH_STORAGE_KEY = 'platform:dev:is-logged-in'
export { DEV_AUTH_CHANGE_EVENT }

export function getDevAuthLoggedIn() {
  if (typeof window === 'undefined') return false
  if (isAdminOnboardingRequired()) return false
  return Boolean(window.localStorage.getItem(PLATFORM_AUTH_TOKEN_KEY))
}

/** 항상 false — mock 데이터 경로 제거 */
export function isPlatformMockLoginSession(): boolean {
  return false
}

/** 항상 false — 마이페이지 mock 카탈로그 미사용 */
export function shouldUsePlatformMockData(): boolean {
  return false
}

/** 항상 false — 공개 콘텐츠 FE 시드 미사용 (remote API만) */
export function shouldUsePlatformContentSeed(): boolean {
  return false
}

export function withPlatformMockData<T>(_value: T, empty: T): T {
  return empty
}

export function withPlatformContentSeed<T>(_value: T, empty: T): T {
  return empty
}

/** 로그아웃 등 — 레거시 mock 세션 키 제거 */
export function setDevAuthLoggedIn(isLoggedIn: boolean) {
  if (typeof window === 'undefined') return
  if (!isLoggedIn) {
    window.localStorage.removeItem(DEV_AUTH_STORAGE_KEY)
  }
  emitDevAuthChange(getDevAuthLoggedIn())
}
