/**
 * terms-documents current API 조회용 별칭.
 * PATCH/pre-register body의 termsType(원장 canonical)은 변경하지 않고 lookup만 fallback한다.
 *
 * @see OpenAPI TermsAgreementRequest — PAYMENT_STATEMENT_PRE_CONSENT → PAYMENT_STATEMENT_CONSENT 정규화
 */

const PAYMENT_STATEMENT_ALIAS_GROUP = [
  'PAYMENT_STATEMENT_CONSENT',
  'PAYMENT_STATEMENT_PRE_CONSENT',
  'PAYMENT_STATEMENT',
] as const

const ALIAS_GROUPS: readonly (readonly string[])[] = [PAYMENT_STATEMENT_ALIAS_GROUP]

function normalizeTermsTypeKey(termsType: string): string {
  return termsType.trim().toUpperCase()
}

function findAliasGroup(normalized: string): readonly string[] | undefined {
  for (const group of ALIAS_GROUPS) {
    if (group.some(type => type === normalized)) return group
  }
  return undefined
}

/** current API 조회 후보 (원본 type 우선, 별칭 순) */
export function resolveTermsTypesForCurrentLookup(termsType: string): string[] {
  const normalized = normalizeTermsTypeKey(termsType)
  if (!normalized) return []

  const group = findAliasGroup(normalized)
  if (group == null) return [normalized]

  const ordered = [normalized, ...group.filter(type => type !== normalized)]
  return [...new Set(ordered)]
}

export function normalizeTermsTypeAliasGroup(termsType: string): string {
  const normalized = normalizeTermsTypeKey(termsType)
  const group = findAliasGroup(normalized)
  if (group == null) return normalized
  return group[0]!
}

export function areTermsTypesEquivalent(a: string, b: string): boolean {
  const left = normalizeTermsTypeKey(a)
  const right = normalizeTermsTypeKey(b)
  if (!left || !right) return false
  if (left === right) return true
  return normalizeTermsTypeAliasGroup(left) === normalizeTermsTypeAliasGroup(right)
}
