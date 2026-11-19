/**
 * Admin SSO redirectUri용 백엔드 public origin.
 * IdP 콘솔·POST /api/admin/auth/sso/login body.redirectUri 에 사용합니다.
 *
 * 프론트 origin(`localhost:3000`)이나 Vite 프록시 타깃(`VITE_DEV_PROXY_TARGET`)은 사용하지 않습니다.
 * Production에서는 명시적인 백엔드 URL을 사용하거나 현재 사이트 출처로 제한합니다.
 */
import {
  getApiBaseUrl,
  pickRemoteApiOrigin,
} from '@/shared/lib/api-remote-env'

function normalizeOrigin(value: string): string {
  const normalized = value.trim().replace(/\/+$/, '')

  try {
    const url = new URL(normalized)
    return `${url.protocol}//${url.host}`
  } catch {
    return normalized
  }
}

function readBackendOriginFromEnv(): string | undefined {
  const picked = pickRemoteApiOrigin(
    import.meta.env.VITE_OAUTH_BACKEND_ORIGIN,
    import.meta.env.VITE_API_SERVER,
    import.meta.env.VITE_API_BASE_URL,
    import.meta.env.VITE_NGROK_SERVER
  )
  return picked ? normalizeOrigin(picked) : undefined
}

export function resolveBackendApiOrigin(): string {
  const origin = readBackendOriginFromEnv()

  if (origin) {
    return origin
  }

  if (import.meta.env.PROD) {
    const sameOrigin = getApiBaseUrl()
    if (sameOrigin) return normalizeOrigin(sameOrigin)
    if (typeof window !== 'undefined') return window.location.origin
  }

  throw new Error(
    'Admin SSO redirectUri backend origin is not configured. Set VITE_OAUTH_BACKEND_ORIGIN or VITE_API_SERVER.'
  )
}

/** DevTools 디버깅용 — OAuth 시작 시 env·resolved origin 출력 */
export function logOAuthBackendOriginDebug(context: string): void {
  if (!import.meta.env.DEV) {
    return
  }

  let resolvedBackendOrigin: string | undefined
  try {
    resolvedBackendOrigin = resolveBackendApiOrigin()
  } catch {
    resolvedBackendOrigin = undefined
  }

  console.table({
    context,
    VITE_OAUTH_BACKEND_ORIGIN: import.meta.env.VITE_OAUTH_BACKEND_ORIGIN ?? '',
    VITE_API_SERVER: import.meta.env.VITE_API_SERVER ?? '',
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL ?? '',
    VITE_DEV_PROXY_TARGET: import.meta.env.VITE_DEV_PROXY_TARGET ?? '',
    VITE_NGROK_SERVER: import.meta.env.VITE_NGROK_SERVER ?? '',
    VITE_OAUTH_REDIRECT_ORIGIN: import.meta.env.VITE_OAUTH_REDIRECT_ORIGIN ?? '',
    resolvedBackendOrigin: resolvedBackendOrigin ?? '(not configured)',
  })
}
