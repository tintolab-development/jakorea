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
import type { SponsorManagementRow } from '@/features/sponsor/model/sponsor-management.types'

const EMPTY_SPONSORS: GeneralProgramSponsorEditContext['sponsors'] = []

/**
 * 후원사 선택 시 담당자 옵션용 컨텍스트.
 * 담당자는 상세 embed가 아니라 contacts API로 전부 로드한다(주 담당자만이 아님).
 *
 * `options.sponsorRows`를 넘기면 후원사 행(id·이름)은 그 목록에서 찾고
 * 후원사 상세 GET(로고 파일 조회 포함)을 하지 않는다. 생략하면 기존처럼 상세를 조회한다.
 */
export function useGeneralProgramSponsorEditContext(
  sponsorIds: readonly string[] = [],
  catalogEnabled = true,
  options?: { sponsorRows?: readonly SponsorManagementRow[] }
): GeneralProgramSponsorEditContext {
  const providedSponsorRows = options?.sponsorRows
  const sponsorDetailQueries = useQueries({
    queries: sponsorIds.map(id => ({
      queryKey: dataManagementQueryKeys.sponsors.detail(id),
      queryFn: () => getSponsorDetail(id),
      enabled: catalogEnabled && Boolean(id) && providedSponsorRows == null,
      staleTime: 30_000,
      retry: 1,
    })),
  })

  const sponsorRowsKey = sponsorDetailQueries
    .map(query => `${query.dataUpdatedAt}:${query.data?.id ?? ''}`)
    .join('|')

  const sponsorIdsKey = sponsorIds.join(',')

  const sponsors = useMemo(() => {
    const rows = providedSponsorRows
      ? sponsorIds
          .map(id => providedSponsorRows.find(row => String(row.id) === String(id)))
          .filter((row): row is SponsorManagementRow => row != null)
      : sponsorDetailQueries
          .map(query => query.data)
          .filter((row): row is NonNullable<typeof row> => row != null)
    return rows.length > 0 ? rows : EMPTY_SPONSORS
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sponsorRowsKey / sponsorIdsKey
  }, [sponsorRowsKey, sponsorIdsKey, providedSponsorRows])

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

  // contactQueries / sponsorIds identity is unstable across renders; depend on stable keys.
  const sponsorsDataUpdatedAt = providedSponsorRows
    ? sponsors.map(row => row.id).join('|')
    : sponsorDetailQueries.map(query => query.dataUpdatedAt).join('|')

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
