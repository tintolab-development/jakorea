/**
 * 로그인 후 원래 화면으로 돌아가기 위한 redirect 처리.
 * cms `shared/utils/post-auth-redirect.ts`와 같은 규칙 — 앱 간 공유 패키지 없이 앱별로 둔다.
 */

export const LOGIN_PATH = '/login'

/** 로그인·가입·찾기·본인인증 등 비로그인 공개 화면 (redirect 대상에서 제외해 루프 방지) */
const LOGGED_OUT_PUBLIC_PATH_PREFIXES = [
  '/login',
  '/register',
  '/find-email',
  '/find-password',
  '/account/identity',
] as const

function isLoggedOutPublicPath(pathname: string): boolean {
  return LOGGED_OUT_PUBLIC_PATH_PREFIXES.some(
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
  if (isLoggedOutPublicPath(pathname)) return null
  return path
}

/** `/login?redirect=<경로>` — 안전하지 않은 경로면 `/login`만 반환 */
export function buildLoginPathWithRedirect(path: string | null | undefined): string {
  const safe = sanitizeLoginRedirectPath(path)
  if (!safe) return LOGIN_PATH
  return `${LOGIN_PATH}?redirect=${encodeURIComponent(safe)}`
}

/** 로그인 성공 후 최종 이동 경로 (admin은 관리자 전용이라 역할 판정 없음) */
export function resolveLoginRedirectTarget(redirect: string | null | undefined): string {
  return sanitizeLoginRedirectPath(redirect) ?? '/'
}
