export const PORTAL_AGE_GROUP = {
  UNDER_14: 'UNDER_14',
  OVER_14: 'OVER_14',
} as const

export type PortalAgeGroup = (typeof PORTAL_AGE_GROUP)[keyof typeof PORTAL_AGE_GROUP]

/** `UNDER_14` | `OVER_14`만 인정. 공백·대소문자는 정규화하고, 그 외는 누락으로 둔다. */
export function parsePortalAgeGroup(value: unknown): PortalAgeGroup | undefined {
  if (typeof value !== 'string') return undefined
  const normalized = value.trim().toUpperCase()
  if (normalized === PORTAL_AGE_GROUP.UNDER_14 || normalized === PORTAL_AGE_GROUP.OVER_14) {
    return normalized
  }
  return undefined
}

export function isUnder14FromAgeGroup(ageGroup: unknown): boolean {
  return parsePortalAgeGroup(ageGroup) === PORTAL_AGE_GROUP.UNDER_14
}

/**
 * 토큰 `ageGroup`이 유효하면 그대로 쓴다.
 * 없거나 파싱되지 않으면 GET /me 결과로만 보완하고, 성인으로 채우지 않는다.
 */
export async function resolvePortalAgeGroupFromTokenOrMe(
  tokenAgeGroup: unknown,
  fetchMe: () => Promise<{ ageGroup?: unknown }>,
): Promise<PortalAgeGroup | undefined> {
  const fromToken = parsePortalAgeGroup(tokenAgeGroup)
  if (fromToken) return fromToken
  const me = await fetchMe()
  return parsePortalAgeGroup(me.ageGroup)
}
