import type { SponsorSponsorshipStatus } from '@/types/domain'

/** 후원 중 / 후원 논의중 / 후원 휴면 / 후원 종료 */
export const SPONSOR_SPONSORSHIP_STATUS_VALUES = [
  'active',
  'discussing',
  'dormant',
  'ended',
] as const satisfies readonly SponsorSponsorshipStatus[]

const SPONSOR_SPONSORSHIP_STATUS_SET = new Set<string>(SPONSOR_SPONSORSHIP_STATUS_VALUES)

export function isSponsorSponsorshipStatus(
  value: string | null | undefined
): value is SponsorSponsorshipStatus {
  return value != null && SPONSOR_SPONSORSHIP_STATUS_SET.has(value)
}

export function parseSponsorSponsorshipStatusFilter(
  raw: string | null | undefined
): 'ALL' | SponsorSponsorshipStatus {
  return isSponsorSponsorshipStatus(raw) ? raw : 'ALL'
}
