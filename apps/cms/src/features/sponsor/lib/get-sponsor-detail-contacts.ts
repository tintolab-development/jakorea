import { getSponsorDetail } from '@/features/sponsor/api/admin-sponsors-service'
import type { SponsorContactRow } from '@/features/sponsor/model/sponsor-management.types'
import { normalizeSponsorContactsSingleLead } from '@/features/sponsor/utils/normalize-sponsor-contacts-single-lead'

/**
 * 후원사 담당자 목록 — API 조회 후 `normalizeSponsorContactsSingleLead` 적용
 */
export async function fetchSponsorDetailContactsNormalized(
  sponsorId: string
): Promise<SponsorContactRow[]> {
  const detail = await getSponsorDetail(sponsorId)
  return normalizeSponsorContactsSingleLead(detail.contacts.map(contact => ({ ...contact })))
}
