import type { ExternalIdentifierResponse } from '@/shared/api/generated/members/schemas'
import type { UserDetailStrategyExternalId1365 } from '@/features/user/detail/strategies/user-detail-role-strategy.types'
import { openPortal1365Main } from '@/shared/constants'

const PROVIDER_1365_ALIASES = new Set(['1365', 'VOLUNTEER_1365', 'KOREA_1365'])

function is1365Provider(provider: string | undefined): boolean {
  if (!provider?.trim()) return false
  const upper = provider.trim().toUpperCase()
  return PROVIDER_1365_ALIASES.has(upper) || upper.includes('1365')
}

export function resolve1365IdFromExternalIdentifiers(
  items: ExternalIdentifierResponse[],
  fallbackFromDetail?: string | null
): string | undefined {
  const match = items.find(item => is1365Provider(item.provider))
  if (match?.externalIdMasked?.trim()) {
    return match.externalIdMasked.trim()
  }
  const fallback = fallbackFromDetail?.trim()
  return fallback || undefined
}

export function mapExternalIdentifiersTo1365Display(
  items: ExternalIdentifierResponse[],
  personalInfoRevealed: boolean,
  fallbackFromDetail?: string | null
): UserDetailStrategyExternalId1365 | undefined {
  const match = items.find(item => is1365Provider(item.provider))
  const masked = match?.externalIdMasked?.trim() || fallbackFromDetail?.trim()
  if (!masked) return undefined

  return {
    maskedLabel: masked,
    fullLabel: personalInfoRevealed ? masked : masked,
    onOpen: openPortal1365Main,
  }
}
