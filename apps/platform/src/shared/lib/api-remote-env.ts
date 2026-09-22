/**
 * 백엔드 URL·프록시 여부 — axios·auth 레이어에서 사용.
 * CMS `apps/cms/src/shared/lib/api-remote-env.ts`와 동일 규칙 + Homepage 이중 프록시.
 *
 * - `VITE_API_BASE_URL`: 브라우저가 직접 호출할 오리진 (크로스 오리진 — 백엔드 CORS)
 * - `VITE_API_SERVER`: 로컬 Vite `/api/portal`, `/api/auth` → CMS(8080) 로그인·회원·NICE
 * - `VITE_HOMEPAGE_API_SERVER`: 로컬 Vite `/api` → JAHOMEADMINBACK(8081) 공개 홈
 */

function backendOriginFromEnv(): string | undefined {
  const fromEnv =
    import.meta.env.VITE_API_SERVER?.trim() ||
    import.meta.env.VITE_DEV_PROXY_TARGET?.trim() ||
    import.meta.env.VITE_NGROK_SERVER?.trim()
  return fromEnv || undefined
}

function homepageOriginFromEnv(): string | undefined {
  const raw = import.meta.env.VITE_HOMEPAGE_API_SERVER?.trim()
  return raw || undefined
}

export function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL?.trim()
  if (raw) return raw.replace(/\/$/, '')
  if (import.meta.env.DEV) {
    return ''
  }
  const productionOrigin = backendOriginFromEnv() || homepageOriginFromEnv()
  if (productionOrigin) return productionOrigin.replace(/\/$/, '')
  return ''
}

/** CMS/Portal(8080) — 로그인·회원가입·세션. */
export function isRemoteApiConfigured(): boolean {
  if (import.meta.env.VITE_API_BASE_URL?.trim()) return true
  return !!backendOriginFromEnv()
}

/** Homepage Admin(8081) — `GET /api/public/main` 등. 로컬 Vite는 미설정 시 8081. */
export function isHomepageApiConfigured(): boolean {
  if (import.meta.env.VITE_API_BASE_URL?.trim()) return true
  if (homepageOriginFromEnv()) return true
  return import.meta.env.DEV
}
