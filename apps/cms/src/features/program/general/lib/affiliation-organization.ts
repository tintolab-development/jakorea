/**
 * 기존 소속(affiliation) ID·표시명 정합.
 * 문자열 소속명만으로 organizationId를 만들지 않으며,
 * 알려진 기관 목록에서 ID와 표시명이 서로 다른 기관을 가리키면 데이터 오류로 처리한다.
 */

export type KnownAffiliationOrganization = {
  organizationId: number
  name: string
}

export class AffiliationOrganizationDataError extends Error {
  readonly affiliationOrganizationId: number | null | undefined
  readonly affiliationDisplayName: string

  constructor(message: string, affiliationOrganizationId: number | null | undefined, affiliationDisplayName: string) {
    super(message)
    this.name = 'AffiliationOrganizationDataError'
    this.affiliationOrganizationId = affiliationOrganizationId
    this.affiliationDisplayName = affiliationDisplayName
  }
}

export function toAffiliationOrganizationId(
  value: number | null | undefined
): number | null | undefined {
  if (value === null) return null
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function normalizeOrganizationName(value: string): string {
  return value.trim().replace(/\s+/g, '').toLowerCase()
}

function namesCompatible(a: string, b: string): boolean {
  const left = normalizeOrganizationName(a)
  const right = normalizeOrganizationName(b)
  if (!left || !right) return true
  return left === right || left.includes(right) || right.includes(left)
}

/**
 * BE 소속 ID·표시명을 그대로 쓰되, knownOrganizations가 있으면 상호 모순을 거부한다.
 * 표시명만 있고 ID가 없으면 ID를 합성하지 않는다.
 */
export function resolveStoredAffiliation(input: {
  affiliationOrganizationId?: number | null
  affiliationDisplayName?: string | null
  knownOrganizations?: readonly KnownAffiliationOrganization[]
}): {
  affiliationOrganizationId: number | null | undefined
  affiliation: string
} {
  const affiliationOrganizationId = toAffiliationOrganizationId(input.affiliationOrganizationId)
  const affiliation = input.affiliationDisplayName?.trim() || ''
  const known = input.knownOrganizations

  if (!known?.length || affiliationOrganizationId == null || !affiliation) {
    return { affiliationOrganizationId, affiliation }
  }

  const byId = known.find(org => org.organizationId === affiliationOrganizationId)
  const byName = known.find(org => namesCompatible(org.name, affiliation))

  if (byId && byName && byId.organizationId !== byName.organizationId) {
    throw new AffiliationOrganizationDataError(
      `소속 표시명과 affiliationOrganizationId가 서로 다른 기관을 가리킵니다. id=${affiliationOrganizationId}, name=${affiliation}`,
      affiliationOrganizationId,
      affiliation
    )
  }

  if (byId && !namesCompatible(byId.name, affiliation) && byName == null) {
    // ID는 알려졌는데 표시명이 그 기관명과 전혀 다르고, 표시명도 다른 known org가 아님 → 엄격 오류는 보류
    // (마스킹·요약 표시명 허용). ID↔표시명이 둘 다 known인데 충돌할 때만 위에서 거부.
  }

  return { affiliationOrganizationId, affiliation }
}
