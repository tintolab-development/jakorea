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

/** 마스킹 표기(`*`) 포함 여부 — 수정 인풋에는 원문만 넣기 위해 사용 */
export function looksMaskedExternalId(value: string | null | undefined): boolean {
  return Boolean(value?.includes('*'))
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

/** 회원 상세·individual privacy unmask 응답에서 1365 원문을 꺼낸다. */
export function extract1365IdFromMemberPrivacyPayload(payload: unknown): string | undefined {
  if (payload == null || typeof payload !== 'object') return undefined
  const asIndividual = payload as IndividualMemberDetailResponse
  const fromMember = asIndividual.member?.external1365Id?.trim()
  if (fromMember) return fromMember
  const asMember = payload as MemberDetailResponse
  return asMember.external1365Id?.trim() || undefined
}

/**
 * external-identifiers의 마스킹 값보다 상세/unmask `external1365Id` 원문을 우선한다.
 */
export function resolve1365IdFromExternalIdentifiers(
  items: ExternalIdentifierResponse[],
  fallbackFromDetail?: string | null
): string | undefined {
  const match = items.find(item => is1365Provider(item.provider))
  const masked = match?.externalIdMasked?.trim() || undefined
  const fallback = fallbackFromDetail?.trim() || undefined
  return preferUnmasked1365Id(fallback, masked)
}

export function mapExternalIdentifiersTo1365Display(
  items: ExternalIdentifierResponse[],
  personalInfoRevealed: boolean,
  fallbackFromDetail?: string | null
): UserDetailStrategyExternalId1365 | undefined {
  const match = items.find(item => is1365Provider(item.provider))
  const masked = match?.externalIdMasked?.trim() || undefined
  const resolved = preferUnmasked1365Id(fallbackFromDetail, masked)
  if (!resolved) return undefined

  const maskedLabel = masked || (looksMaskedExternalId(resolved) ? resolved : undefined) || resolved
  const fullLabel = personalInfoRevealed
    ? preferUnmasked1365Id(fallbackFromDetail, resolved) || resolved
    : maskedLabel

  return {
    maskedLabel,
    fullLabel,
    onOpen: openPortal1365Main,
  }
}
