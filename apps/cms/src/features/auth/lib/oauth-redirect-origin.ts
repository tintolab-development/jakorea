/**
 * OAuth redirect_uri origin.
 * 로컬 Vite는 http, 카카오 콘솔에 https만 등록하면 KOE006이 납니다.
 */
export function resolveOAuthRedirectOrigin(): string {
  const fromEnv = import.meta.env.VITE_OAUTH_REDIRECT_ORIGIN?.trim()
  if (fromEnv) {
    return fromEnv.replace(/\/$/, '')
  }

  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  return 'http://localhost:3000'
}
