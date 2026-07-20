import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import { getSponsorDetail } from '@/features/sponsor/api/admin-sponsors-service'
import { dataManagementQueryKeys } from '@/features/data-management/api/data-management-query-keys'
import type { GeneralProgramSponsorEditContext } from '@/features/program/general/model/common-info-edit-schema'
import { useSponsorOptionsQuery } from '@/features/sponsor/hooks/use-sponsor-options-query'
import { normalizeSponsorContactsSingleLead } from '@/features/sponsor/utils/normalize-sponsor-contacts-single-lead'

const EMPTY_SPONSORS: GeneralProgramSponsorEditContext['sponsors'] = []

export function useGeneralProgramSponsorEditContext(
  sponsorIds: readonly string[] = []
): GeneralProgramSponsorEditContext {
  const sponsorsQuery = useSponsorOptionsQuery()
  const sponsors = sponsorsQuery.data ?? EMPTY_SPONSORS

  const contactQueries = useQueries({
    queries: sponsorIds.map(id => ({
      queryKey: dataManagementQueryKeys.sponsors.detail(id),
      queryFn: () => getSponsorDetail(id),
      enabled: Boolean(id) && sponsorsQuery.isSuccess,
      staleTime: 30_000,
    })),
  })

  // useQueries returns a new array each render; key off dataUpdatedAt so the context
  // object only changes when contact payloads actually update.
  const contactDataKey = contactQueries.map(q => q.dataUpdatedAt).join('|')
  const sponsorIdsKey = sponsorIds.join(',')

  // contactQueries / sponsorIds identity is unstable across renders; depend on stable keys.
  return useMemo((): GeneralProgramSponsorEditContext => {
    const contactsBySponsorId: GeneralProgramSponsorEditContext['contactsBySponsorId'] = {}
    sponsorIds.forEach((id, index) => {
      const detail = contactQueries[index]?.data
      if (!detail) return
      contactsBySponsorId[id] = normalizeSponsorContactsSingleLead(
        detail.contacts.map(contact => ({ ...contact }))
      )
    })
    return { sponsors, contactsBySponsorId }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed by contactDataKey / sponsorIdsKey
  }, [contactDataKey, sponsorIdsKey, sponsors])
}
