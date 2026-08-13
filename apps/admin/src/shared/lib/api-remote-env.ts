/**
 * 백엔드 URL·프록시 여부
 * - CMS (`VITE_API_SERVER`): `/api/admin/auth`
 * - Homepage (`VITE_HOMEPAGE_API_SERVER`): 그 외 `/api`
 */

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
  if (raw) return raw.replace(/\/$/, '')
  if (import.meta.env.DEV && devProxyBackendOrigin()) {
    return ''
  }
  return ''
}

/** CMS 또는 Homepage 프록시/직접 URL이 있으면 true — API 로그인 버튼 활성 조건 */
export function isRemoteApiConfigured(): boolean {
  if (import.meta.env.VITE_API_BASE_URL?.trim()) return true
  return !!(import.meta.env.DEV && (cmsProxyBackendOrigin() || homepageProxyBackendOrigin()))
}
