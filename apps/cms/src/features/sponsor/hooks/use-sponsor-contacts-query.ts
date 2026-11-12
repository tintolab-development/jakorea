import { useQuery } from '@tanstack/react-query'
import { getSponsorContacts } from '@/features/sponsor/api/admin-sponsors-service'
import { EMPTY_CONTACTS_PARAMS_KEY } from '@/features/sponsor/api/contacts-filter-params'
import { dataManagementQueryKeys } from '@/features/data-management/api/data-management-query-keys'
import { useDataManagementRemoteEnabled } from '@/features/data-management/hooks/use-data-management-remote-enabled'
import { normalizeSponsorContactsSingleLead } from '@/features/sponsor/utils/normalize-sponsor-contacts-single-lead'
import { SPONSOR_CONTACT_PII_QUERY_CACHE } from '@/features/sponsor/lib/contact-query-cache'

export function useSponsorContactsQuery(sponsorId: string | null | undefined, enabled = true) {
  const remoteEnabled = useDataManagementRemoteEnabled(
    'sponsors',
    enabled && Boolean(sponsorId?.trim())
  )

  return useQuery({
    queryKey: dataManagementQueryKeys.sponsors.contacts(sponsorId ?? '', EMPTY_CONTACTS_PARAMS_KEY),
    queryFn: () => getSponsorContacts(sponsorId!),
    enabled: remoteEnabled && Boolean(sponsorId?.trim()),
    ...SPONSOR_CONTACT_PII_QUERY_CACHE,
    select: contacts =>
      normalizeSponsorContactsSingleLead(contacts.map(contact => ({ ...contact }))),
  })
}
