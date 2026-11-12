import { useMemo } from 'react'
import { useQueries, useQuery } from '@tanstack/react-query'
import {
  getSponsorContacts,
  getSponsorDetail,
} from '@/features/sponsor/api/admin-sponsors-service'
import { SPONSOR_CONTACT_PII_QUERY_CACHE } from '@/features/sponsor/lib/contact-query-cache'
import { dataManagementQueryKeys } from '@/features/data-management/api/data-management-query-keys'
import { useDataManagementRemoteEnabled } from '@/features/data-management/hooks/use-data-management-remote-enabled'
import type { GeneralProgramSponsorEditContext } from '@/features/program/general/model/common-info-edit-schema'
import { normalizeSponsorContactsSingleLead } from '@/features/sponsor/utils/normalize-sponsor-contacts-single-lead'
import type { SponsorManagementRow } from '@/features/sponsor/model/sponsor-management.types'

const EMPTY_SPONSORS: GeneralProgramSponsorEditContext['sponsors'] = []

/**
 * 프로그램 공통 정보 수정의 후원사 담당자 선택지는 `contactPrivacy=MASKED`로 받는다(정책 32·37, 기획 Q8).
 * 원문 + 「후원사 담당자 정보를 확인하기 위함」 자동 기록은 데이터 관리 > 후원사 담당자 정보(CMS-17, RAW)에만 있다.
 * 키를 데이터 관리 캐시(`sponsors.detail`·`sponsors.contactsAll`)와 분리해 RAW 응답과 섞지 않는다.
 * 서버가 파라미터를 반영하기 전에는 원문이 올 수 있으므로 화면은 FE에서도 마스킹한다(연락처 미표시·maskSponsorManagerPhone).
 */
export const PROGRAM_SPONSOR_CONTACT_PRIVACY = 'MASKED' as const

export const programSponsorMaskedQueryKeys = {
  detail: (sponsorId: string) =>
    [
      ...dataManagementQueryKeys.sponsors.all(),
      'program-masked-detail',
      sponsorId,
    ] as const,
  contacts: (sponsorId: string) =>
    [
      ...dataManagementQueryKeys.sponsors.all(),
      'program-masked-contacts',
      sponsorId,
    ] as const,
}

function fetchProgramSponsorContactsMasked(sponsorId: string) {
  return getSponsorContacts(sponsorId, undefined, { contactPrivacy: PROGRAM_SPONSOR_CONTACT_PRIVACY })
}

/** 단일 후원사 담당자 선택지(MASKED) — 프로그램 공통 정보 수정 화면 전용 */
export function useProgramSponsorContactsMaskedQuery(
  sponsorId: string | null | undefined,
  enabled = true
) {
  const id = sponsorId?.trim() ?? ''
  const remoteEnabled = useDataManagementRemoteEnabled('sponsors', enabled && Boolean(id))
  return useQuery({
    queryKey: programSponsorMaskedQueryKeys.contacts(id),
    queryFn: () => fetchProgramSponsorContactsMasked(id),
    enabled: remoteEnabled && Boolean(id),
    // 서버 반영 전에는 원문이 올 수 있어 데이터 관리와 같은 Class G(진입마다 조회·이탈 시 제거)
    ...SPONSOR_CONTACT_PII_QUERY_CACHE,
    select: contacts =>
      normalizeSponsorContactsSingleLead(contacts.map(contact => ({ ...contact }))),
  })
}

/**
 * 후원사 선택 시 담당자 옵션용 컨텍스트(공통 정보 수정 모드 전용 — 호출부가 catalogEnabled로 제한).
 * 담당자는 상세 embed가 아니라 contacts API(contactPrivacy=MASKED)로 전부 로드한다(주 담당자만이 아님).
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
      queryKey: programSponsorMaskedQueryKeys.detail(id),
      queryFn: () => getSponsorDetail(id, { contactPrivacy: PROGRAM_SPONSOR_CONTACT_PRIVACY }),
      enabled: catalogEnabled && Boolean(id) && providedSponsorRows == null,
      // 상세 응답에도 담당자 원문이 있어 후원사 화면과 같은 캐시 정책(CMS-17)
      ...SPONSOR_CONTACT_PII_QUERY_CACHE,
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
      queryKey: programSponsorMaskedQueryKeys.contacts(id),
      queryFn: () => fetchProgramSponsorContactsMasked(id),
      enabled: catalogEnabled && Boolean(id),
      ...SPONSOR_CONTACT_PII_QUERY_CACHE,
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
