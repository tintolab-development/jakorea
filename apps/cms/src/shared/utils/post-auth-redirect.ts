/**
 * MFA 검증 등 로그인 완료 후 이동 경로.
 * 임시 비밀번호 변경이 필요하면 대시보드 대신 안내·변경 화면으로 보낸다.
 */

export const PASSWORD_CHANGE_REQUIRED_PATH = '/auth/password-change-required'

/** 최초 로그인 온보딩 미완료 — auth-store와 공통 */
export const PASSWORD_CHANGE_REQUIRED_STORAGE_KEY = 'auth_password_change_required'

/** 비번변경 완료 후 소셜 연결 온보딩 중 — sessionStorage */
export const PASSWORD_CHANGE_REQUIRED_SOCIAL_ONBOARDING_STORAGE_KEY =
  'cms:password-change-required-social-onboarding'

/**
 * 비밀번호 변경 완료 후 소셜 연결 온보딩 중.
 * passwordChangeRequired/complete 플래그를 지운 뒤에도 대시보드(`/`)로 새지 않게 한다.
 */
export const PASSWORD_CHANGE_REQUIRED_SOCIAL_CONNECT_PATH =
  '/register/social-connect?flow=password-change-required'

export const passwordChangeRequiredPaths = {
  notice: PASSWORD_CHANGE_REQUIRED_PATH,
  birth: `${PASSWORD_CHANGE_REQUIRED_PATH}/birth`,
  identity: `${PASSWORD_CHANGE_REQUIRED_PATH}/identity`,
  identityCallback: `${PASSWORD_CHANGE_REQUIRED_PATH}/identity/callback`,
  identityMock: `${PASSWORD_CHANGE_REQUIRED_PATH}/identity/mock`,
  changePassword: `${PASSWORD_CHANGE_REQUIRED_PATH}/change-password`,
  complete: `${PASSWORD_CHANGE_REQUIRED_PATH}/complete`,
  socialConnect: PASSWORD_CHANGE_REQUIRED_SOCIAL_CONNECT_PATH,
} as const

export function resolvePostAuthRedirectPath(options: {
  passwordChangeRequired?: boolean | null
  complete?: boolean | null
  socialOnboarding?: boolean | null
  fallbackPath: string
}): string {
  if (options.socialOnboarding === true) {
    return passwordChangeRequiredPaths.socialConnect
  }
  if (options.complete === true) {
    return passwordChangeRequiredPaths.complete
  }
  if (options.passwordChangeRequired === true) {
    return PASSWORD_CHANGE_REQUIRED_PATH
  }
  return options.fallbackPath
}

/**
 * access 만료·refresh 실패 시 이동 경로.
 * 최초 로그인 완료 화면이면 로그인/대시보드로 보내지 않는다. `null`은 현재 화면 유지.
 */
export function resolveSessionAuthFailureRedirect(options: {
  pathname: string
  search?: string
  complete: boolean
  socialOnboarding?: boolean
}): string | null {
  if (options.socialOnboarding) {
    return passwordChangeRequiredPaths.socialConnect
  }
  if (options.complete) {
    return passwordChangeRequiredPaths.complete
  }
  if (isPasswordChangeRequiredPath(options.pathname)) {
    return null
  }
  if (isPasswordChangeRequiredSocialConnectPath(options.pathname, options.search)) {
    return null
  }
  const path = `${options.pathname}${options.search ?? ''}`
  return `/login?next=${encodeURIComponent(path)}`
}

export function isPasswordChangeRequiredPath(pathname: string): boolean {
  return (
    pathname === PASSWORD_CHANGE_REQUIRED_PATH ||
    pathname.startsWith(`${PASSWORD_CHANGE_REQUIRED_PATH}/`)
  )
}

export function isPasswordChangeRequiredSocialConnectPath(
  pathname: string,
  search?: string
): boolean {
  // pathname에 쿼리가 붙는 경우·search 누락을 모두 허용
  const combined = pathname.includes('?') ? pathname : `${pathname}${search ?? ''}`
  if (!combined.includes('/register/social-connect')) {
    return false
  }
  try {
    const url = new URL(combined, 'http://local.invalid')
    if (
      url.pathname.replace(/\/+$/, '') !== '/register/social-connect' &&
      url.pathname.replace(/\/+$/, '') !== '/register/social-connect/complete'
    ) {
      return false
    }
    return url.searchParams.get('flow') === 'password-change-required'
  } catch {
    return /(?:^\?|&)flow=password-change-required(?:&|$)/.test(
      combined.includes('?') ? combined.slice(combined.indexOf('?')) : (search ?? '')
    )
  }
}

/**
 * 관리자 등록 회원 최초 로그인 — 본인인증·비밀번호(회원정보) 확인이 끝나기 전.
 * `/api/admin/me` 403 등 권한 안내 공통 팝업을 막기 위해 사용한다.
 */
export function isAdminFirstLoginOnboardingIncomplete(options?: {
  pathname?: string
  storage?: Pick<Storage, 'getItem'> | null
}): boolean {
  const storage =
    options?.storage !== undefined
      ? options.storage
      : typeof window !== 'undefined'
        ? window.localStorage
        : null
  if (storage?.getItem(PASSWORD_CHANGE_REQUIRED_STORAGE_KEY) === '1') return true
  if (
    typeof window !== 'undefined' &&
    window.sessionStorage?.getItem(PASSWORD_CHANGE_REQUIRED_SOCIAL_ONBOARDING_STORAGE_KEY) === '1'
  ) {
    return true
  }
  const pathname =
    options?.pathname ?? (typeof window !== 'undefined' ? window.location.pathname : '')
  const search =
    typeof window !== 'undefined' && options?.pathname === undefined ? window.location.search : ''
  if (isPasswordChangeRequiredSocialConnectPath(pathname, search)) return true
  return isPasswordChangeRequiredPath(pathname)
}
