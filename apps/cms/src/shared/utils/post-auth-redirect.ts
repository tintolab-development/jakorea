/**
 * MFA 검증 등 로그인 완료 후 이동 경로.
 * 임시 비밀번호 변경이 필요하면 대시보드 대신 안내·변경 화면으로 보낸다.
 */

export const PASSWORD_CHANGE_REQUIRED_PATH = '/auth/password-change-required'

/** 최초 로그인 온보딩 미완료 — auth-store와 공통 */
export const PASSWORD_CHANGE_REQUIRED_STORAGE_KEY = 'auth_password_change_required'

export const passwordChangeRequiredPaths = {
  notice: PASSWORD_CHANGE_REQUIRED_PATH,
  birth: `${PASSWORD_CHANGE_REQUIRED_PATH}/birth`,
  identity: `${PASSWORD_CHANGE_REQUIRED_PATH}/identity`,
  identityCallback: `${PASSWORD_CHANGE_REQUIRED_PATH}/identity/callback`,
  identityMock: `${PASSWORD_CHANGE_REQUIRED_PATH}/identity/mock`,
  changePassword: `${PASSWORD_CHANGE_REQUIRED_PATH}/change-password`,
  complete: `${PASSWORD_CHANGE_REQUIRED_PATH}/complete`,
} as const

export function resolvePostAuthRedirectPath(options: {
  passwordChangeRequired?: boolean | null
  complete?: boolean | null
  fallbackPath: string
}): string {
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
}): string | null {
  if (options.complete) {
    return passwordChangeRequiredPaths.complete
  }
  if (isPasswordChangeRequiredPath(options.pathname)) {
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
  const pathname =
    options?.pathname ?? (typeof window !== 'undefined' ? window.location.pathname : '')
  return isPasswordChangeRequiredPath(pathname)
}
