/**
 * 백엔드 URL·프록시 여부 — axios·auth 외 레이어에서도 쓰며, auth-store 순환 참조를 피하기 위해 분리.
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

/** 백엔드가 구성되어 있으면 true (직접 URL 또는 dev 프록시). mock vs 실 API 최종 선택은 `real-api-modules` 등에서 결합. */
export function isRemoteApiConfigured(): boolean {
  if (import.meta.env.VITE_API_BASE_URL?.trim()) return true
  return !!(import.meta.env.DEV && devProxyBackendOrigin())
}
