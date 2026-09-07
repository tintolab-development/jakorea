/**
 * OAuth **frontendReturnUrl** origin (로그인 완료·가입 연결 복귀 URL).
 * Admin SSO IdP `redirect_uri`가 아니다 — 그 값은 `resolveBackendApiOrigin()` +
 * `/api/admin/auth/sso/{provider}/callback`.
 *
 * 로컬 Vite는 http, 카카오 콘솔에 https만 등록하면 KOE006이 납니다.
 * Production에서 env가 localhost로 박혀 있으면 배포 호스트(`window.location.origin`)를 씁니다.
 */
import { isLocalOrLoopbackOrigin } from '@/shared/lib/api-remote-env'

export function resolveOAuthRedirectOrigin(): string {
  const fromEnv = import.meta.env.VITE_OAUTH_REDIRECT_ORIGIN?.trim()
  if (fromEnv) {
    const normalized = fromEnv.replace(/\/$/, '')
    if (!(import.meta.env.PROD && isLocalOrLoopbackOrigin(normalized))) {
      return normalized
    }
  }

  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  return 'http://localhost:3000'
}
