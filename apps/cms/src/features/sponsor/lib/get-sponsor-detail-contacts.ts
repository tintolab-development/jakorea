import { getSponsorContacts } from '@/features/sponsor/api/admin-sponsors-service'
import type { SponsorContactRow } from '@/features/sponsor/model/sponsor-management.types'
import type { Sponsor } from '@/types/domain'
import { normalizeSponsorContactsSingleLead } from '@/features/sponsor/utils/normalize-sponsor-contacts-single-lead'

/**
 * 후원사 mock·목록 행의 `managers` → 담당자 선택 옵션용 연락처 목록
 */
export function getSponsorDetailContactsNormalized(
  sponsor: Pick<Sponsor, 'id' | 'managers'>
): SponsorContactRow[] {
  const contacts: SponsorContactRow[] = (sponsor.managers ?? []).map((manager, index) => ({
    id: `${sponsor.id}-manager-${index + 1}`,
    name: manager.name,
    department: '',
    position: '',
    officePhone: '',
    phone: manager.phone,
    email: '',
    companyAddress: '',
    memo: '',
    registeredAt: '',
    contactType: index === 0 ? 'lead' : 'assistant',
  }))
  return normalizeSponsorContactsSingleLead(contacts)
}

/**
 * 후원사 담당자 목록 — GET /contacts 후 `normalizeSponsorContactsSingleLead` 적용
 */
export async function fetchSponsorDetailContactsNormalized(
  sponsorId: string
): Promise<SponsorContactRow[]> {
  const contacts = await getSponsorContacts(sponsorId)
  return normalizeSponsorContactsSingleLead(contacts.map(contact => ({ ...contact })))
}
