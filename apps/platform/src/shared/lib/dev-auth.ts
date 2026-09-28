import { isAdminOnboardingRequired } from './admin-onboarding-session'
import { isRemoteApiConfigured } from './api-remote-env'
import { getAccessToken, PLATFORM_AUTH_TOKEN_KEY } from './auth-token'
import { DEV_AUTH_CHANGE_EVENT, emitDevAuthChange } from './auth-session-event'

/** DEV mock 로그인 세션 — `sign-in` Mock 버튼 전용 */
const DEV_AUTH_STORAGE_KEY = 'platform:dev:is-logged-in'
export { DEV_AUTH_CHANGE_EVENT }

export function getDevAuthLoggedIn() {
  if (typeof window === 'undefined') return false
  // 관리자 등록 온보딩 미완료: 토큰이 있어도 정상 로그인 UI로 취급하지 않음
  if (isAdminOnboardingRequired()) return false
  // 실로그인 토큰이 있으면 로그인으로 간주 (헤더·마이페이지 가드 호환)
  if (window.localStorage.getItem(PLATFORM_AUTH_TOKEN_KEY)) return true
  // DEV mock 로그인 — access token 없이 마이페이지 mock 진입
  if (import.meta.env.DEV) {
    return window.localStorage.getItem(DEV_AUTH_STORAGE_KEY) === 'true'
  }
  return false
}

/**
 * Platform mock 카탈로그를 쓸지.
 * remote API + access token(실세션)이면 false — 비로그인이면 true.
 * `getDevAuthLoggedIn()`은 토큰이 있어도 true라서 데이터 소스 가드로 쓰지 않는다.
 *
 * **마이페이지 개인 데이터**(신청·일정·정산·문의 등)에만 사용한다.
 * 공개 콘텐츠 시드는 `shouldUsePlatformContentSeed` 를 본다.
 */
export function shouldUsePlatformMockData(): boolean {
  if (typeof window === 'undefined') return true
  return !(isRemoteApiConfigured() && Boolean(getAccessToken()))
}

/**
 * 공개 콘텐츠(프로그램·공지·실적·스토리·교재·기관소개 등) 시드 노출 여부.
 * Portal 목록/상세 API 연동 전까지는 remote 세션에서도 시드를 유지해 **시안 규격 레이아웃**이
 * 빈 목록으로 붕괴되지 않게 한다. API 연동 후 화면별로 false/실데이터로 전환한다.
 */
export function shouldUsePlatformContentSeed(): boolean {
  return true
}

export function withPlatformMockData<T>(value: T, empty: T): T {
  return shouldUsePlatformMockData() ? value : empty
}

export function withPlatformContentSeed<T>(value: T, empty: T): T {
  return shouldUsePlatformContentSeed() ? value : empty
}

/**
 * 로그인 상태 변경 알림.
 * - 실세션: access token이 SSOT
 * - DEV mock: `platform:dev:is-logged-in` (sign-in Mock 버튼)
 */
export function setDevAuthLoggedIn(isLoggedIn: boolean) {
  if (typeof window === 'undefined') return
  if (import.meta.env.DEV) {
    if (isLoggedIn) {
      window.localStorage.setItem(DEV_AUTH_STORAGE_KEY, 'true')
    } else {
      window.localStorage.removeItem(DEV_AUTH_STORAGE_KEY)
    }
  } else if (!isLoggedIn) {
    window.localStorage.removeItem(DEV_AUTH_STORAGE_KEY)
  }
  emitDevAuthChange(getDevAuthLoggedIn())
}
