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
  return buildLoginPathWithRedirect(`${options.pathname}${options.search ?? ''}`)
}

/** 로그인 후 원래 화면으로 돌아가기 위한 쿼리 키 */
export const LOGIN_REDIRECT_PARAM = 'redirect'

/** `/login?redirect=<경로>` — 안전하지 않은 경로면 `/login`만 반환 */
export function buildLoginPathWithRedirect(path: string | null | undefined): string {
  const safe = sanitizeLoginRedirectPath(path)
  if (!safe) return '/login'
  return `/login?${LOGIN_REDIRECT_PARAM}=${encodeURIComponent(safe)}`
}

/**
 * 로그인 후 이동할 redirect 값 검증.
 * 같은 앱 내부 경로만 허용하고, 로그인·인증 화면(루프)과 `/`(기본 경로와 동일)는 제외한다.
 */
export function sanitizeLoginRedirectPath(value: string | null | undefined): string | null {
  if (value == null) return null
  const path = value.trim()
  if (path === '' || !path.startsWith('/')) return null
  if (path.startsWith('//') || path.includes('://') || path.includes('\\')) return null
  const pathname = path.split(/[?#]/)[0] ?? ''
  if (pathname === '/' || pathname === '') return null
  if (isCmsLoggedOutPublicPath(pathname)) return null
  if (pathname === '/mfa' || pathname.startsWith('/mfa/')) return null
  return path
}

/** 로그인·가입·찾기 등 비로그인 공개 화면 — 로그아웃 후 다시 보내지 않음 */
export function isCmsLoggedOutPublicPath(pathname: string): boolean {
  if (pathname === '/login' || pathname.startsWith('/login/')) return true
  if (pathname === '/register' || pathname.startsWith('/register/')) return true
  if (pathname === '/find-email' || pathname.startsWith('/find-email/')) return true
  if (pathname === '/find-password' || pathname.startsWith('/find-password/')) return true
  if (pathname === '/social-connect' || pathname.startsWith('/social-connect/')) return true
  if (pathname === '/oauth' || pathname.startsWith('/oauth/')) return true
  return isPasswordChangeRequiredPath(pathname)
}

/**
 * 세션이 끝난 뒤 보호 화면에 남지 않도록 로그인으로 보낸다.
 * 공개 인증 화면에 있으면 그대로 둔다.
 */
export function assignLoginAfterSessionEnd(options?: {
  pathname?: string
  search?: string
  complete?: boolean
  /** `false`면 원래 경로를 붙이지 않는다 (사용자가 직접 로그아웃). 기본 `true` */
  preserveReturnPath?: boolean
  assign?: (url: string) => void
}): void {
  if (typeof window === 'undefined' && options?.assign == null) return
  const pathname = options?.pathname ?? window.location.pathname
  const search = options?.search ?? window.location.search
  if (isCmsLoggedOutPublicPath(pathname)) return
  const complete = options?.complete === true
  const target =
    options?.preserveReturnPath === false && !complete
      ? '/login'
      : resolveSessionAuthFailureRedirect({ pathname, search, complete })
  if (target == null) return
  const current = `${pathname}${search}`
  if (current === target) return
  const assign = options?.assign ?? ((url: string) => window.location.assign(url))
  assign(target)
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
