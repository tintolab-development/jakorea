/**
 * 백엔드 URL·프록시 여부 — axios·auth 레이어에서 사용.
 * CMS `apps/cms/src/shared/lib/api-remote-env.ts`와 동일 규칙.
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
  if (import.meta.env.DEV && backendOriginFromEnv()) {
    return ''
  }
  const productionOrigin = backendOriginFromEnv()
  if (productionOrigin) return productionOrigin.replace(/\/$/, '')
  return ''
}

/** 백엔드가 구성되어 있으면 true (직접 URL 또는 dev 프록시). */
export function isRemoteApiConfigured(): boolean {
  if (import.meta.env.VITE_API_BASE_URL?.trim()) return true
  return !!backendOriginFromEnv()
}
