/**
 * Portal SSO frontendReturnUrl origin.
 * IdP redirect_uri(BE callback)와 별개 — 로그인 완료·가입 연결 복귀 URL용.
 */
export function resolveOAuthRedirectOrigin(): string {
  const fromEnv = import.meta.env.VITE_OAUTH_REDIRECT_ORIGIN?.trim()
  if (fromEnv) {
    const normalized = fromEnv.replace(/\/$/, '')
    const isLocal =
      /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?$/i.test(normalized) ||
      normalized.includes('localhost') ||
      normalized.includes('127.0.0.1')
    if (!(import.meta.env.PROD && isLocal)) {
      return normalized
    }
  }

  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  return 'http://localhost:5173'
}
