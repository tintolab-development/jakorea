function decodeJwtPayload(accessToken: string): Record<string, unknown> | null {
  const parts = accessToken.trim().split('.')
  if (parts.length < 2) return null
  try {
    const base64 = parts[1]!.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
    if (typeof atob !== 'function') return null
    const json = atob(padded)
    const payload = JSON.parse(json)
    return payload && typeof payload === 'object' && !Array.isArray(payload)
      ? (payload as Record<string, unknown>)
      : null
  } catch {
    return null
  }
}

/** JWT `sid` 참고값. 보안 판정은 BE 응답이 정본이며 FE가 sid를 만들지 않는다. */
export function readJwtSidClaim(accessToken: string | null | undefined): string | null {
  if (!accessToken?.trim()) return null
  const payload = decodeJwtPayload(accessToken)
  const sid = payload?.sid
  return typeof sid === 'string' && sid.trim() ? sid.trim() : null
}

/**
 * JWT `exp`(ms) 참고값. Session GET 401 시 "Access 자체 만료" 여부를 판단하는 요청 제어 힌트일 뿐이며
 * 보안 판정은 BE 응답이 정본이다. 읽을 수 없으면 null.
 */
export function readJwtExpiresAtMs(accessToken: string | null | undefined): number | null {
  if (!accessToken?.trim()) return null
  const exp = decodeJwtPayload(accessToken)?.exp
  return typeof exp === 'number' && Number.isFinite(exp) && exp > 0 ? exp * 1000 : null
}
