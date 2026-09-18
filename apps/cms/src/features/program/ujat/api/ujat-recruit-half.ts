/**
 * UI half (`h1`|`h2`) ↔ Admin API `recruitHalf`
 */

import type { UjatVolunteerRecruitHalf } from '@/features/program/ujat/model/ujat-volunteer-screening-constants'

export type UjatRecruitHalfApi = 'FIRST_HALF' | 'SECOND_HALF'

export function toUjatRecruitHalfApi(half: UjatVolunteerRecruitHalf | 'h1' | 'h2'): UjatRecruitHalfApi {
  return half === 'h2' ? 'SECOND_HALF' : 'FIRST_HALF'
}

export function fromUjatRecruitHalfApi(
  value: string | null | undefined,
  fallback: UjatVolunteerRecruitHalf
): UjatVolunteerRecruitHalf {
  const normalized = value?.trim().toUpperCase()
  if (
    normalized === 'SECOND_HALF' ||
    normalized === 'H2' ||
    normalized === 'SECOND'
  ) {
    return 'h2'
  }
  if (
    normalized === 'FIRST_HALF' ||
    normalized === 'H1' ||
    normalized === 'FIRST'
  ) {
    return 'h1'
  }
  return fallback
}
