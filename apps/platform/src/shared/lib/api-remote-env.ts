/**
 * 백엔드 URL·프록시 여부 — axios·auth 레이어에서 사용.
 * CMS `apps/cms/src/shared/lib/api-remote-env.ts`와 동일 규칙 + Homepage 이중 라우팅.
 *
 * - `VITE_API_BASE_URL`: JABACK 직접 호출 오리진 (배포·CORS)
 * - `VITE_HOMEPAGE_API_BASE_URL`: JAHOME 직접 호출 오리진 (정적 배포)
 * - `VITE_API_SERVER`: 로컬 Vite `/api/portal`, `/api/auth` → JABACK
 * - `VITE_HOMEPAGE_API_SERVER`: 로컬 Vite 그 외 `/api` → JAHOMEADMINBACK
 */

/** 로컬 JABACK bootRun 기본 (vite proxy·직호출 공통) */
export const JABACK_LOCAL_DEV_ORIGIN = 'http://localhost:8080'

function normalizeOrigin(origin: string): string {
  return origin.replace(/\/$/, '')
}

function normalizeRequestPath(raw: string): string {
  const value = raw.trim()
  if (!value) return ''
  try {
    return new URL(value, 'https://frontend.invalid').pathname
  } catch {
    return value.split('?')[0] ?? value
  }
}

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

function pathUsesJabackApi(path: string): boolean {
  return (
    path === '/api/portal' ||
    path.startsWith('/api/portal/') ||
    path === '/api/auth' ||
    path.startsWith('/api/auth/') ||
    path === '/api/public/terms-documents' ||
    path.startsWith('/api/public/terms-documents/')
  )
}

/**
 * DEV에서 JABACK 경로 axios baseURL.
 * - `VITE_API_BASE_URL` → 직접 오리진
 * - `VITE_API_SERVER` 등 → '' (5173 vite proxy → JABACK)
 * - 미설정 → :8080 직호출 (5173에 `/api/auth`가 8081 catch-all로 빠지지 않게)
 */
function getJabackApiBaseUrlInDev(): string {
  const fromBase = import.meta.env.VITE_API_BASE_URL?.trim()
  if (fromBase) return normalizeOrigin(fromBase)
  if (backendOriginFromEnv()) return ''
  return JABACK_LOCAL_DEV_ORIGIN
}

export function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL?.trim()
  if (raw) return normalizeOrigin(raw)
  if (import.meta.env.DEV) {
    return ''
  }
  const productionOrigin = backendOriginFromEnv() || homepageOriginFromEnv()
  if (productionOrigin) return normalizeOrigin(productionOrigin)
  return ''
}

export function getHomepageApiBaseUrl(): string {
  const raw = import.meta.env.VITE_HOMEPAGE_API_BASE_URL?.trim()
  if (raw) return normalizeOrigin(raw)

  if (import.meta.env.PROD) {
    const fromServer = homepageOriginFromEnv()
    if (fromServer) return normalizeOrigin(fromServer)
  }

  return ''
}

/**
 * 정적 배포에서는 Vite proxy가 없으므로 로컬 proxy 계약을 브라우저 요청에도 동일하게 적용한다.
 * - /api/portal, /api/auth, /api/public/terms-documents → JABACK
 * - 그 외 /api → JAHOME
 */
export function getApiBaseUrlForPath(requestUrl: string): string {
  const path = normalizeRequestPath(requestUrl)

  if (!import.meta.env.PROD) {
    if (pathUsesJabackApi(path)) {
      return getJabackApiBaseUrlInDev()
    }
    return getApiBaseUrl()
  }

  const jabackOrigin = getApiBaseUrl()
  if (pathUsesJabackApi(path)) return jabackOrigin

  if (path === '/api' || path.startsWith('/api/')) {
    return getHomepageApiBaseUrl() || jabackOrigin
  }

  return jabackOrigin
}

/** CMS/Portal(8080) — 로그인·회원가입·세션·NICE 본인인증. */
export function isRemoteApiConfigured(): boolean {
  if (import.meta.env.VITE_API_BASE_URL?.trim()) return true
  if (backendOriginFromEnv()) return true
  if (import.meta.env.DEV) return true
  return false
}

/** Homepage Admin(8081) — `GET /api/public/main` 등. */
export function isHomepageApiConfigured(): boolean {
  if (import.meta.env.VITE_HOMEPAGE_API_BASE_URL?.trim()) return true
  if (import.meta.env.VITE_API_BASE_URL?.trim()) return true
  if (homepageOriginFromEnv()) return true
  return import.meta.env.DEV
}
