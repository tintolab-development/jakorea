/**
 * 백엔드 URL·프록시 여부 — axios·auth 외 레이어에서도 쓰며, auth-store 순환 참조를 피하기 위해 분리.
 *
 * - `VITE_API_BASE_URL`: 브라우저가 직접 호출할 오리진 (배포·CORS)
 * - `VITE_API_SERVER`: 로컬은 Vite `/api` 프록시 타깃, 배포는 프록시가 없으므로 동일 오리진으로 사용
 *
 * Production: localhost·127.0.0.1 등은 무시한다. 별도 오리진이 설정되지
 * 않았다면 현재 사이트와 동일한 출처에서 /api 경로를 호출한다.
 * NEWPROD와 QA를 혼용하는 고정된 fallback은 사용하지 않는다.
 */

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

  // Production: 프록시 없음. VITE_API_BASE_URL이 비어 있어도 VITE_API_SERVER를 사용한다.
  // 환경에 지정된 API 오리진을 우선 사용한다.
  const fromServer = backendOriginFromEnv()
  if (fromServer) return fromServer

  if (import.meta.env.PROD) {
    // Same-origin /api is routed by the deployment's CloudFront behavior.
    return ''
  }

  return ''
}

/** 백엔드가 구성되어 있으면 true (직접 URL 또는 dev 프록시). mock vs 실 API 최종 선택은 `real-api-modules` 등에서 결합. */
export function isRemoteApiConfigured(): boolean {
  if (import.meta.env.PROD) return true
  if (pickRemoteApiOrigin(import.meta.env.VITE_API_BASE_URL)) return true
  return !!backendOriginFromEnv()
}
