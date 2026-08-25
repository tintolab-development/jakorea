import type { QueryClient } from '@tanstack/react-query'
import { dataManagementQueryKeys } from '@/features/data-management/api/data-management-query-keys'
import type {
  SponsorContactRow,
  SponsorManagementDetailView,
} from '@/features/sponsor/model/sponsor-management.types'
import { normalizeSponsorContactsSingleLead } from '@/features/sponsor/utils/normalize-sponsor-contacts-single-lead'

function patchDetailContacts(
  queryClient: QueryClient,
  sponsorId: string,
  updater: (contacts: SponsorContactRow[]) => SponsorContactRow[]
): void {
  const detailKey = dataManagementQueryKeys.sponsors.detail(sponsorId)
  queryClient.setQueryData<SponsorManagementDetailView>(detailKey, old => {
    if (!old) return old
    return { ...old, contacts: updater(old.contacts) }
  })
}

export function mergeCreatedContact(
  contacts: SponsorContactRow[],
  created: SponsorContactRow
): SponsorContactRow[] {
  const withoutDup = contacts.filter(contact => contact.id !== created.id)
  return normalizeSponsorContactsSingleLead([created, ...withoutDup])
}

export function mergeUpdatedContact(
  contacts: SponsorContactRow[],
  updated: SponsorContactRow
): SponsorContactRow[] {
  const hasRow = contacts.some(contact => contact.id === updated.id)
  const base = hasRow ? contacts : [updated, ...contacts]
  const next = base.map(contact => {
    if (contact.id === updated.id) return updated
    if (updated.contactType === 'lead' && contact.contactType === 'lead') {
      return { ...contact, contactType: 'assistant' as const }
    }
    return contact
  })
  return normalizeSponsorContactsSingleLead(next)
}

export function removeContactsById(
  contacts: SponsorContactRow[],
  ids: readonly string[]
): SponsorContactRow[] {
  const idSet = new Set(ids)
  return normalizeSponsorContactsSingleLead(contacts.filter(contact => !idSet.has(contact.id)))
}

/** 담당자 생성 응답으로 상세 캐시를 즉시 갱신한다. 목록은 호출부에서 비동기 invalidate. */
export function applyCreatedContactToDetail(
  queryClient: QueryClient,
  sponsorId: string,
  created: SponsorContactRow
): void {
  patchDetailContacts(queryClient, sponsorId, contacts => mergeCreatedContact(contacts, created))
}

export function applyUpdatedContactToDetail(
  queryClient: QueryClient,
  sponsorId: string,
  updated: SponsorContactRow
): void {
  patchDetailContacts(queryClient, sponsorId, contacts => mergeUpdatedContact(contacts, updated))
}

export function applyDeletedContactsToDetail(
  queryClient: QueryClient,
  sponsorId: string,
  ids: readonly string[]
): void {
  patchDetailContacts(queryClient, sponsorId, contacts => removeContactsById(contacts, ids))
}

export function invalidateSponsorLists(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({
    queryKey: dataManagementQueryKeys.sponsors.listAll(),
  })
}
