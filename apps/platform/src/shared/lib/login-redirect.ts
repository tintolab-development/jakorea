/**
 * 로그인 후 원래 화면으로 돌아가기 위한 redirect 처리.
 * cms·admin과 같은 규칙 — 앱 간 공유 패키지 없이 앱별로 둔다.
 */

export const SIGN_IN_PATH = '/auth/sign-in'

/**
 * 로그인 직후 다시 보내면 루프가 되거나 의미 없는 공개 인증 화면.
 * `/auth/admin-registered/*`(관리자 등록 회원 온보딩)는 로그인 후 복귀 대상이라 제외하지 않는다.
 */
const LOGIN_LOOP_PATH_PREFIXES = [
  '/auth/sign-in',
  '/auth/required',
  '/auth/sign-up',
  '/auth/find-email',
  '/auth/find-password',
  '/auth/social',
] as const

function isLoginLoopPath(pathname: string): boolean {
  return LOGIN_LOOP_PATH_PREFIXES.some(
    prefix => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

/**
 * 같은 앱 내부 경로만 허용한다. 외부 URL·프로토콜 상대 경로·로그인 화면·`/`는 `null`.
 */
export function sanitizeLoginRedirectPath(value: string | null | undefined): string | null {
  if (value == null) return null
  const path = value.trim()
  if (path === '' || !path.startsWith('/')) return null
  if (path.startsWith('//') || path.includes('://') || path.includes('\\')) return null
  const pathname = path.split(/[?#]/)[0] ?? ''
  if (pathname === '/' || pathname === '') return null
  if (isLoginLoopPath(pathname)) return null
  return path
}

/** `/auth/sign-in?redirect=<경로>` — 안전하지 않은 경로면 `/auth/sign-in`만 반환 */
export function buildSignInPathWithRedirect(path: string | null | undefined): string {
  const safe = sanitizeLoginRedirectPath(path)
  if (!safe) return SIGN_IN_PATH
  return `${SIGN_IN_PATH}?redirect=${encodeURIComponent(safe)}`
}

/** 로그인 성공 후 이동 경로 (안전하지 않으면 홈) */
export function resolveLoginRedirectTarget(redirect: string | null | undefined): string {
  return sanitizeLoginRedirectPath(redirect) ?? '/'
}

/**
 * 소셜 로그인 왕복(외부 IdP) 후 복귀 경로.
 * 완료 URL의 `redirect`가 우선이고, 없으면 시작 시 sessionStorage에 저장한 returnUrl(login intent일 때만)을 쓴다.
 */
export function resolveSocialLoginReturnPath(options: {
  queryRedirect: string | null | undefined
  oauthIntent: string | null | undefined
  storedReturnUrl: string | null | undefined
}): string {
  const fromQuery = sanitizeLoginRedirectPath(options.queryRedirect)
  if (fromQuery) return fromQuery
  if (options.oauthIntent !== 'login') return '/'
  return resolveLoginRedirectTarget(options.storedReturnUrl)
}
