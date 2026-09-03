/**
 * 백엔드 URL·프록시 여부 — axios·auth 외 레이어에서도 쓰며, auth-store 순환 참조를 피하기 위해 분리.
 *
 * - `VITE_API_BASE_URL`: 브라우저가 직접 호출할 오리진 (배포·CORS)
 * - `VITE_API_SERVER`: 로컬은 Vite `/api` 프록시 타깃, 배포는 프록시가 없으므로 동일 오리진으로 사용
 *
 * Production(`vite build` / Vercel): localhost·127.0.0.1 등은 무시하고
 * {@link CMS_DEPLOY_API_ORIGIN}(CloudFront 실서버)으로 고정한다.
 */

/** CMS 배포 기본 API (CloudFront). Vercel·`.env.production`과 동일 오리진. */
export const CMS_DEPLOY_API_ORIGIN = 'https://d3r1iaa0sy4tcq.cloudfront.net'

function normalizeOrigin(origin: string): string {
  return origin.replace(/\/$/, '')
}

/** 배포 빌드에 넣으면 안 되는 로컬/루프백 오리진 */
export function isLocalOrLoopbackOrigin(origin: string): boolean {
  try {
    const { hostname } = new URL(origin)
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '[::1]' ||
      hostname === '::1' ||
      hostname.endsWith('.local')
    )
  } catch {
    return true
  }
}

/**
 * 후보 중 첫 유효 오리진. Production에서는 로컬 오리진을 건너뛴다.
 */
export function pickRemoteApiOrigin(
  ...candidates: Array<string | undefined | null>
): string | undefined {
  for (const raw of candidates) {
    const trimmed = raw?.trim()
    if (!trimmed) continue
    if (import.meta.env.PROD && isLocalOrLoopbackOrigin(trimmed)) continue
    return normalizeOrigin(trimmed)
  }
  return undefined
}

function backendOriginFromEnv(): string | undefined {
  return pickRemoteApiOrigin(
    import.meta.env.VITE_API_SERVER,
    import.meta.env.VITE_DEV_PROXY_TARGET,
    import.meta.env.VITE_NGROK_SERVER
  )
}

export function getApiBaseUrl(): string {
  const fromBase = pickRemoteApiOrigin(import.meta.env.VITE_API_BASE_URL)
  if (fromBase) return fromBase

  // DEV: Vite가 `/api` → VITE_API_SERVER 로 프록시하므로 브라우저는 상대 경로를 쓴다.
  if (import.meta.env.DEV && backendOriginFromEnv()) {
    return ''
  }

  const fromServer = backendOriginFromEnv()
  if (fromServer) return fromServer

  // Production: env 누락·localhost 오염 시에도 실서버로 고정
  if (import.meta.env.PROD) {
    return CMS_DEPLOY_API_ORIGIN
  }

  return ''
}

/** 백엔드가 구성되어 있으면 true (직접 URL 또는 dev 프록시). mock vs 실 API 최종 선택은 `real-api-modules` 등에서 결합. */
export function isRemoteApiConfigured(): boolean {
  if (import.meta.env.PROD) return true
  if (pickRemoteApiOrigin(import.meta.env.VITE_API_BASE_URL)) return true
  return !!backendOriginFromEnv()
}
