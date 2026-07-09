/**
 * Admin SSO redirectUri용 백엔드 public origin.
 * IdP 콘솔·POST /api/admin/auth/sso/login body.redirectUri 에 사용합니다.
 *
 * 프론트 origin(`localhost:3000`)이나 Vite 프록시 타깃(`VITE_DEV_PROXY_TARGET`)은 사용하지 않습니다.
 */
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
  const candidates = [
    import.meta.env.VITE_OAUTH_BACKEND_ORIGIN,
    import.meta.env.VITE_API_SERVER,
    import.meta.env.VITE_API_BASE_URL,
    import.meta.env.VITE_NGROK_SERVER,
  ]

  for (const raw of candidates) {
    const trimmed = raw?.trim()
    if (trimmed) {
      return normalizeOrigin(trimmed)
    }
  }

  return undefined
}

export function resolveBackendApiOrigin(): string {
  const origin = readBackendOriginFromEnv()

  if (origin) {
    return origin
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
    VITE_OAUTH_EXCHANGE_MODE: import.meta.env.VITE_OAUTH_EXCHANGE_MODE ?? '',
    resolvedBackendOrigin: resolvedBackendOrigin ?? '(not configured)',
  })
}
