/**
 * 관리자 등록 회원 온보딩(본인인증·비밀번호 변경) 미완료 세션.
 * 토큰은 API용으로 유지하되, UI상 정상 로그인으로 취급하지 않는다.
 */

export const PLATFORM_ADMIN_ONBOARDING_REQUIRED_KEY = 'platform:admin-onboarding-required'

export const ADMIN_REGISTERED_ONBOARDING_PATH = '/auth/admin-registered/notice'

function canUseStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage)
}

export function isAdminOnboardingRequired() {
  if (!canUseStorage()) return false
  return localStorage.getItem(PLATFORM_ADMIN_ONBOARDING_REQUIRED_KEY) === '1'
}

export function setAdminOnboardingRequired(required: boolean) {
  if (!canUseStorage()) return

  if (required) {
    localStorage.setItem(PLATFORM_ADMIN_ONBOARDING_REQUIRED_KEY, '1')
  } else {
    localStorage.removeItem(PLATFORM_ADMIN_ONBOARDING_REQUIRED_KEY)
  }
}

/** 로그인 필요 가드: 온보딩 미완료면 안내 화면, 아니면 로그인 유도 */
export function resolveLoginRequiredPath(redirectPath: string) {
  if (isAdminOnboardingRequired()) {
    return ADMIN_REGISTERED_ONBOARDING_PATH
  }
  return `/auth/required?redirect=${encodeURIComponent(redirectPath)}`
}
