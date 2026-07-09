import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import { getSponsorDetail } from '@/features/sponsor/api/admin-sponsors-service'
import { dataManagementQueryKeys } from '@/features/data-management/api/data-management-query-keys'
import type { GeneralProgramSponsorEditContext } from '@/features/program/general/model/common-info-edit-schema'
import { useSponsorOptionsQuery } from '@/features/sponsor/hooks/use-sponsor-options-query'
import { normalizeSponsorContactsSingleLead } from '@/features/sponsor/utils/normalize-sponsor-contacts-single-lead'

export function useGeneralProgramSponsorEditContext(
  sponsorIds: readonly string[] = []
): GeneralProgramSponsorEditContext {
  const sponsorsQuery = useSponsorOptionsQuery()
  const sponsors = sponsorsQuery.data ?? []

  const contactQueries = useQueries({
    queries: sponsorIds.map(id => ({
      queryKey: dataManagementQueryKeys.sponsors.detail(id),
      queryFn: () => getSponsorDetail(id),
      enabled: Boolean(id) && sponsorsQuery.isSuccess,
      staleTime: 30_000,
    })),
  })

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
  }, [contactQueries, sponsorIds, sponsors])
}
