import type { SponsorContactRow } from '@/features/sponsor/model/sponsor-management.types'

/**
 * 담당자가 1명 이상일 때: 주 담당자(lead)는 정확히 1명.
 * - lead가 여러 명이면 목록 앞선 1명만 유지, 나머지는 assistant
 * - lead가 없으면 첫 행을 lead로 승격
 */
export function normalizeSponsorContactsSingleLead(contacts: SponsorContactRow[]): SponsorContactRow[] {
  if (contacts.length === 0) return contacts

  let keptLead = false
  const deduped: SponsorContactRow[] = contacts.map(contact => {
    if (contact.contactType !== 'lead') return contact
    if (!keptLead) {
      keptLead = true
      return contact
    }
    return { ...contact, contactType: 'assistant' as const }
  })

  if (deduped.some(c => c.contactType === 'lead')) return deduped

  return deduped.map((c, i): SponsorContactRow =>
    i === 0 ? { ...c, contactType: 'lead' as const } : c
  )
}
