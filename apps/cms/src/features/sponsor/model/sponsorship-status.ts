import type { SponsorSponsorshipStatus } from '@/types/domain'

/** 제품 GO 전: 후원 중 / 후원 종료만 */
export const SPONSOR_SPONSORSHIP_STATUS_VALUES = [
  'active',
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
