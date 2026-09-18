import { isAdminOnboardingRequired } from './admin-onboarding-session'
import { isRemoteApiConfigured } from './api-remote-env'
import { getAccessToken, PLATFORM_AUTH_TOKEN_KEY } from './auth-token'
import { DEV_AUTH_CHANGE_EVENT, emitDevAuthChange } from './auth-session-event'

/** @deprecated mock 로그인 제거 후 레거시 키 정리용 */
const LEGACY_DEV_AUTH_STORAGE_KEY = 'platform:dev:is-logged-in'
export { DEV_AUTH_CHANGE_EVENT }

export function getDevAuthLoggedIn() {
  if (typeof window === 'undefined') return false
  // 관리자 등록 온보딩 미완료: 토큰이 있어도 정상 로그인 UI로 취급하지 않음
  if (isAdminOnboardingRequired()) return false
  // 실로그인 토큰만으로 로그인 판정
  return Boolean(window.localStorage.getItem(PLATFORM_AUTH_TOKEN_KEY))
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
 * 로그인 상태 변경 알림. 실세션은 토큰이 SSOT이므로 `true`는 무시하고 레거시 mock 플래그만 정리한다.
 */
export function setDevAuthLoggedIn(_isLoggedIn: boolean) {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(LEGACY_DEV_AUTH_STORAGE_KEY)
  emitDevAuthChange(getDevAuthLoggedIn())
}
