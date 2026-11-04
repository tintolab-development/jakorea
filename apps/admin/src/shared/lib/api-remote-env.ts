/**
 * 백엔드 URL·프록시 여부
 * - CMS/JABACK (`VITE_API_BASE_URL` / 로컬 `VITE_API_SERVER`): `/api/admin/auth`
 * - Homepage/JAHOME (`VITE_HOMEPAGE_API_BASE_URL` / 로컬 `VITE_HOMEPAGE_API_SERVER`): 그 외 `/api`
 */

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

function homepageProxyBackendOrigin(): string | undefined {
  return import.meta.env.VITE_HOMEPAGE_API_SERVER?.trim() || undefined
}

function cmsProxyBackendOrigin(): string | undefined {
  const fromEnv =
    import.meta.env.VITE_API_SERVER?.trim() ||
    import.meta.env.VITE_DEV_PROXY_TARGET?.trim() ||
    import.meta.env.VITE_NGROK_SERVER?.trim()
  return fromEnv || undefined
}

function devProxyBackendOrigin(): string | undefined {
  return cmsProxyBackendOrigin() || homepageProxyBackendOrigin()
}

export function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL?.trim()
  if (raw) return normalizeOrigin(raw)
  if (import.meta.env.DEV && devProxyBackendOrigin()) {
    return ''
  }
  return ''
}

export function getHomepageApiBaseUrl(): string {
  const raw = import.meta.env.VITE_HOMEPAGE_API_BASE_URL?.trim()
  if (raw) return normalizeOrigin(raw)

  if (import.meta.env.PROD) {
    const fromServer = homepageProxyBackendOrigin()
    if (fromServer) return normalizeOrigin(fromServer)
  }

  return ''
}

/**
 * 정적 배포에서는 Vite proxy가 없으므로 요청 path에 따라 두 백엔드 오리진을 선택한다.
 * 로컬 DEV는 기존 Vite 이중 프록시를 그대로 사용한다.
 */
export function getApiBaseUrlForPath(requestUrl: string): string {
  const cmsOrigin = getApiBaseUrl()
  if (!import.meta.env.PROD) return cmsOrigin

  const path = normalizeRequestPath(requestUrl)
  if (path === '/api/admin/auth' || path.startsWith('/api/admin/auth/')) {
    return cmsOrigin
  }
  if (path === '/api/admin/me' || path.startsWith('/api/admin/me/')) {
    return cmsOrigin
  }
  if (
    path === '/api/auth/verification-sessions' ||
    path.startsWith('/api/auth/verification-sessions/')
  ) {
    return cmsOrigin
  }
  if (path === '/api/public/terms-documents' || path.startsWith('/api/public/terms-documents/')) {
    return cmsOrigin
  }

  if (path === '/api' || path.startsWith('/api/')) {
    return getHomepageApiBaseUrl() || cmsOrigin
  }

  return cmsOrigin
}

/** CMS 또는 Homepage 프록시/직접 URL이 있으면 true — API 로그인 버튼 활성 조건 */
export function isRemoteApiConfigured(): boolean {
  if (import.meta.env.VITE_API_BASE_URL?.trim()) return true
  return !!(import.meta.env.DEV && (cmsProxyBackendOrigin() || homepageProxyBackendOrigin()))
}
