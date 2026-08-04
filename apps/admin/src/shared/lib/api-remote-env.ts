/**
 * 백엔드 URL·프록시 여부 (CMS와 동일 패턴)
 */

function devProxyBackendOrigin(): string | undefined {
  const fromEnv =
    import.meta.env.VITE_API_SERVER?.trim() ||
    import.meta.env.VITE_DEV_PROXY_TARGET?.trim() ||
    import.meta.env.VITE_NGROK_SERVER?.trim()
  return fromEnv || undefined
}

export function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL?.trim()
  if (raw) return raw.replace(/\/$/, '')
  if (import.meta.env.DEV && devProxyBackendOrigin()) {
    return ''
  }
  return ''
}

export function isRemoteApiConfigured(): boolean {
  if (import.meta.env.VITE_API_BASE_URL?.trim()) return true
  return !!(import.meta.env.DEV && devProxyBackendOrigin())
}
