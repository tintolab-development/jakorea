import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import {
  getSponsorContacts,
  getSponsorDetail,
} from '@/features/sponsor/api/admin-sponsors-service'
import { EMPTY_CONTACTS_PARAMS_KEY } from '@/features/sponsor/api/contacts-filter-params'
import { dataManagementQueryKeys } from '@/features/data-management/api/data-management-query-keys'
import type { GeneralProgramSponsorEditContext } from '@/features/program/general/model/common-info-edit-schema'
import { normalizeSponsorContactsSingleLead } from '@/features/sponsor/utils/normalize-sponsor-contacts-single-lead'

const EMPTY_SPONSORS: GeneralProgramSponsorEditContext['sponsors'] = []

/**
 * 후원사 선택 시 담당자 옵션용 컨텍스트.
 * 담당자는 상세 embed가 아니라 contacts API로 전부 로드한다(주 담당자만이 아님).
 */
export function useGeneralProgramSponsorEditContext(
  sponsorIds: readonly string[] = [],
  catalogEnabled = true
): GeneralProgramSponsorEditContext {
  const sponsorDetailQueries = useQueries({
    queries: sponsorIds.map(id => ({
      queryKey: dataManagementQueryKeys.sponsors.detail(id),
      queryFn: () => getSponsorDetail(id),
      enabled: catalogEnabled && Boolean(id),
      staleTime: 30_000,
      retry: 1,
    })),
  })

  const sponsorRowsKey = sponsorDetailQueries
    .map(query => `${query.dataUpdatedAt}:${query.data?.id ?? ''}`)
    .join('|')

  const sponsors = useMemo(() => {
    const rows = sponsorDetailQueries
      .map(query => query.data)
      .filter((row): row is NonNullable<typeof row> => row != null)
    return rows.length > 0 ? rows : EMPTY_SPONSORS
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sponsorRowsKey
  }, [sponsorRowsKey])

  const contactQueries = useQueries({
    queries: sponsorIds.map(id => ({
      queryKey: dataManagementQueryKeys.sponsors.contacts(id, EMPTY_CONTACTS_PARAMS_KEY),
      queryFn: () => getSponsorContacts(id),
      enabled: catalogEnabled && Boolean(id),
      staleTime: 30_000,
    })),
  })

  // useQueries returns a new array each render; key off dataUpdatedAt so the context
  // object only changes when contact payloads actually update.
  const contactDataKey = contactQueries.map(q => q.dataUpdatedAt).join('|')
  const sponsorIdsKey = sponsorIds.join(',')

  // contactQueries / sponsorIds identity is unstable across renders; depend on stable keys.
  const sponsorsDataUpdatedAt = sponsorDetailQueries
    .map(query => query.dataUpdatedAt)
    .join('|')

  return useMemo((): GeneralProgramSponsorEditContext => {
    const contactsBySponsorId: GeneralProgramSponsorEditContext['contactsBySponsorId'] = {}
    sponsorIds.forEach((id, index) => {
      const contacts = contactQueries[index]?.data
      if (!contacts) return
      contactsBySponsorId[String(id)] = normalizeSponsorContactsSingleLead(
        contacts.map(contact => ({ ...contact }))
      )
    })
    return { sponsors, contactsBySponsorId }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed by contactDataKey / sponsorIdsKey / sponsorsDataUpdatedAt
  }, [contactDataKey, sponsorIdsKey, sponsorsDataUpdatedAt])
}
