import { buildSponsorManagementDetailView } from '@/data/mock/sponsor-management-detail'
import type { SponsorContactRow, SponsorManagementRow } from '@/features/sponsor/model/sponsor-management.types'
import { normalizeSponsorContactsSingleLead } from '@/features/sponsor/utils/normalize-sponsor-contacts-single-lead'

/**
 * 후원사 상세(`/sponsor?sponsorId=…`) 담당자 테이블과 동일한 목록(목 데이터 + `normalizeSponsorContactsSingleLead`).
 * 추후 API 연동 시 이 함수 내부만 서비스 호출로 교체하면 됨.
 */
export function getSponsorDetailContactsNormalized(
  sponsor: SponsorManagementRow
): SponsorContactRow[] {
  const detail = buildSponsorManagementDetailView(sponsor)
  return normalizeSponsorContactsSingleLead(detail.contacts.map(c => ({ ...c })))
}
