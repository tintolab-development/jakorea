import type { ExternalIdentifierResponse } from '@/shared/api/generated/members/schemas'
import type { IndividualMemberDetailResponse } from '@/shared/api/generated/members/schemas/individualMemberDetailResponse'
import type { MemberDetailResponse } from '@/shared/api/generated/members/schemas/memberDetailResponse'
import type { UserDetailStrategyExternalId1365 } from '@/features/user/detail/strategies/user-detail-role-strategy.types'
import { openPortal1365Main } from '@/shared/constants'

const PROVIDER_1365_ALIASES = new Set(['1365', 'VOLUNTEER_1365', 'KOREA_1365'])

/** PATCH `/external-identifiers/{provider}` path provider */
export const EXTERNAL_IDENTIFIER_PROVIDER_1365 = 'VOLUNTEER_1365' as const

function is1365Provider(provider: string | undefined): boolean {
  if (!provider?.trim()) return false
  const upper = provider.trim().toUpperCase()
  return PROVIDER_1365_ALIASES.has(upper) || upper.includes('1365')
}

/** 마스킹 표기(`*`) 포함 여부 */
export function looksMaskedExternalId(value: string | null | undefined): boolean {
  return Boolean(value?.includes('*'))
}

/**
 * 연락처 `MASKING_POLICY.phone`과 동일 — 조회 모드에서만 FE 마스킹.
 * 이미 BE 마스킹(`*`)이면 그대로 둔다.
 */
export function mask1365IdForDisplay(value: string): string {
  const t = value.trim()
  if (!t) return t
  if (looksMaskedExternalId(t)) return t
  if (t.length <= 4) return '*'.repeat(t.length)
  return `${t.slice(0, 4)}***`
}

/** 조회 표시 — 연락처/이메일과 같이 revealed 시에만 원문 */
export function detail1365Display(
  id1365: string | null | undefined,
  revealed: boolean
): string {
  const t = id1365?.trim()
  if (!t) return '-'
  if (revealed) return t
  return mask1365IdForDisplay(t)
}

/**
 * 후보 중 마스킹되지 않은 원문을 우선한다.
 * 원문이 없으면 첫 번째 non-empty 값(마스킹 포함)을 반환한다.
 */
export function preferUnmasked1365Id(
  ...candidates: Array<string | null | undefined>
): string | undefined {
  const trimmed = candidates
    .map(value => value?.trim())
    .filter((value): value is string => Boolean(value))
  if (trimmed.length === 0) return undefined
  return trimmed.find(value => !looksMaskedExternalId(value)) ?? trimmed[0]
}

/** 회원 상세·individual privacy unmask 응답에서 1365 ID를 꺼낸다. */
export function extract1365IdFromMemberPrivacyPayload(payload: unknown): string | undefined {
  if (payload == null || typeof payload !== 'object') return undefined
  const asIndividual = payload as IndividualMemberDetailResponse
  const asMember = (asIndividual.member ?? payload) as MemberDetailResponse
  const loose = payload as {
    external1365Id?: string
    member?: { external1365Id?: string; externalId?: string }
    externalId?: string
  }
  return preferUnmasked1365Id(
    asIndividual.member?.external1365Id,
    asMember.external1365Id,
    loose.external1365Id,
    loose.member?.externalId,
    loose.externalId
  )
}

/**
 * external-identifiers 목록에서 1365 값을 찾는다.
 * `externalIdMasked`는 마스킹 전용 — 상세/unmask `external1365Id`가 있으면 그쪽을 쓴다.
 */
export function resolve1365IdFromExternalIdentifiers(
  items: ExternalIdentifierResponse[],
  fallbackFromDetail?: string | null
): string | undefined {
  const match = items.find(item => is1365Provider(item.provider)) as
    | (ExternalIdentifierResponse & { externalId?: string })
    | undefined
  const masked = match?.externalIdMasked?.trim() || undefined
  const looseFull = match?.externalId?.trim() || undefined
  const fallback = fallbackFromDetail?.trim() || undefined
  return preferUnmasked1365Id(fallback, looseFull, masked)
}

/**
 * 연락처·이메일과 동일하게 **상세/unmask의 `external1365Id`를 SSOT**로 둔다.
 * external-identifiers의 마스킹 값은 상세에 값이 없을 때만 폴백한다.
 */
export function assignUser1365IdFromDetailAndIdentifiers(
  user: { id1365?: string },
  detailExternal1365Id: string | null | undefined,
  identifiers: ExternalIdentifierResponse[]
): void {
  const fromDetail = detailExternal1365Id?.trim()
  if (fromDetail) {
    user.id1365 = fromDetail
    return
  }
  const fromIdentifiers = resolve1365IdFromExternalIdentifiers(identifiers)
  if (fromIdentifiers) user.id1365 = fromIdentifiers
}

export function mapExternalIdentifiersTo1365Display(
  items: ExternalIdentifierResponse[],
  personalInfoRevealed: boolean,
  fallbackFromDetail?: string | null
): UserDetailStrategyExternalId1365 | undefined {
  const resolved = resolve1365IdFromExternalIdentifiers(items, fallbackFromDetail)
  if (!resolved) return undefined

  const match = items.find(item => is1365Provider(item.provider))
  const masked =
    match?.externalIdMasked?.trim() ||
    (looksMaskedExternalId(resolved) ? resolved : mask1365IdForDisplay(resolved))

  return {
    maskedLabel: masked,
    fullLabel: personalInfoRevealed ? preferUnmasked1365Id(fallbackFromDetail, resolved) || resolved : masked,
    onOpen: openPortal1365Main,
  }
}
