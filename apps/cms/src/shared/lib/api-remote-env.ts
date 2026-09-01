/**
 * 백엔드 URL·프록시 여부 — axios·auth 외 레이어에서도 쓰며, auth-store 순환 참조를 피하기 위해 분리.
 *
 * - `VITE_API_BASE_URL`: 브라우저가 직접 호출할 오리진 (배포·CORS)
 * - `VITE_API_SERVER`: 로컬은 Vite `/api` 프록시 타깃, 배포는 프록시가 없으므로 동일 오리진으로 사용
 */

function backendOriginFromEnv(): string | undefined {
  const fromEnv =
    import.meta.env.VITE_API_SERVER?.trim() ||
    import.meta.env.VITE_DEV_PROXY_TARGET?.trim() ||
    import.meta.env.VITE_NGROK_SERVER?.trim()
  return fromEnv || undefined
}

export function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL?.trim()
  if (raw) return raw.replace(/\/$/, '')
  // DEV: Vite가 `/api` → VITE_API_SERVER 로 프록시하므로 브라우저는 상대 경로를 쓴다.
  if (import.meta.env.DEV && backendOriginFromEnv()) {
    return ''
  }
  // Production: 프록시 없음. 로컬 .env를 그대로 넣은 경우 VITE_API_BASE_URL이 비어 있어도
  // VITE_API_SERVER를 API 오리진으로 사용한다.
  const productionOrigin = backendOriginFromEnv()
  if (productionOrigin) return productionOrigin.replace(/\/$/, '')
  return ''
}

/** 백엔드가 구성되어 있으면 true (직접 URL 또는 dev 프록시). mock vs 실 API 최종 선택은 `real-api-modules` 등에서 결합. */
export function isRemoteApiConfigured(): boolean {
  if (import.meta.env.VITE_API_BASE_URL?.trim()) return true
  return !!backendOriginFromEnv()
}
