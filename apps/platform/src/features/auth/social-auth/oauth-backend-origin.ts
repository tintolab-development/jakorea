/**
 * Portal SSO IdP redirectUri용 백엔드 public origin.
 * `POST .../start` 응답 authorizationUrl의 redirect_uri 재작성에 사용.
 */
import { getApiBaseUrl, isRemoteApiConfigured } from '@/shared/lib/api-remote-env'

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
    const trimmed = typeof raw === 'string' ? raw.trim() : ''
    if (!trimmed) continue
    // relative / empty base → skip
    if (trimmed.startsWith('/')) continue
    return normalizeOrigin(trimmed)
  }
  return undefined
}

export function resolveBackendApiOrigin(): string {
  const fromEnv = readBackendOriginFromEnv()
  if (fromEnv) {
    return fromEnv
  }

  const base = getApiBaseUrl()
  if (base) {
    return normalizeOrigin(base)
  }

  if (typeof window !== 'undefined' && isRemoteApiConfigured()) {
    return window.location.origin
  }

  throw new Error(
    'Portal SSO redirectUri backend origin is not configured. Set VITE_OAUTH_BACKEND_ORIGIN or VITE_API_SERVER.'
  )
}
