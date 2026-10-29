/** 로컬 CMS Vite 기본 포트. 배포는 `VITE_CMS_ORIGIN`으로 덮어쓴다. */
const DEFAULT_CMS_ORIGIN = 'http://localhost:3000'

function readCmsOriginEnv(): string {
  return import.meta.env.VITE_CMS_ORIGIN?.trim() ?? ''
}

/**
 * 배포 빌드에서 env가 없으면 localhost 링크를 노출하지 않는다.
 * 로컬 `import.meta.env.DEV` 는 기본 origin을 허용한다.
 */
export function shouldExposeCmsAuthLinks(): boolean {
  if (readCmsOriginEnv()) return true
  return import.meta.env.DEV === true
}

export function getCmsAppOrigin(): string {
  const fromEnv = readCmsOriginEnv()
  return (fromEnv || DEFAULT_CMS_ORIGIN).replace(/\/$/, '')
}

/** CMS 앱 경로로 가는 절대 URL. `pathWithQuery`는 `/find-email` 또는 `/register?foo=1` 형식. */
export function getCmsAuthUrl(pathWithQuery: string): string {
  if (/^https?:\/\//i.test(pathWithQuery)) return pathWithQuery
  const path = pathWithQuery.startsWith('/') ? pathWithQuery : `/${pathWithQuery}`
  return `${getCmsAppOrigin()}${path}`
}
