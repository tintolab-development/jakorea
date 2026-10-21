/** 로컬 CMS Vite 기본 포트. 배포는 `VITE_CMS_ORIGIN`으로 덮어쓴다. */
const DEFAULT_CMS_ORIGIN = 'http://localhost:3000'

export function getCmsAppOrigin(): string {
  const fromEnv = import.meta.env.VITE_CMS_ORIGIN?.trim()
  return (fromEnv || DEFAULT_CMS_ORIGIN).replace(/\/$/, '')
}

/** CMS 앱 경로로 가는 절대 URL. `pathWithQuery`는 `/find-email` 또는 `/register?foo=1` 형식. */
export function getCmsAuthUrl(pathWithQuery: string): string {
  if (/^https?:\/\//i.test(pathWithQuery)) return pathWithQuery
  const path = pathWithQuery.startsWith('/') ? pathWithQuery : `/${pathWithQuery}`
  return `${getCmsAppOrigin()}${path}`
}
