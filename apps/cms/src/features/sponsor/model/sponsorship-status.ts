import type { SponsorSponsorshipStatus } from '@/types/domain'

/** 후원 중 / 후원 종료 / 후원 논의중 / 후원 휴면 */
export const SPONSOR_SPONSORSHIP_STATUS_VALUES = [
  'active',
  'ended',
  'discussing',
  'dormant',
] as const satisfies readonly SponsorSponsorshipStatus[]

export function isSponsorSponsorshipStatus(
  value: string | null | undefined
): value is SponsorSponsorshipStatus {
  return (
    value === 'active' ||
    value === 'ended' ||
    value === 'discussing' ||
    value === 'dormant'
  )
}

export function parseSponsorSponsorshipStatusFilter(
  raw: string | null | undefined
): 'ALL' | SponsorSponsorshipStatus {
  return isSponsorSponsorshipStatus(raw) ? raw : 'ALL'
}
