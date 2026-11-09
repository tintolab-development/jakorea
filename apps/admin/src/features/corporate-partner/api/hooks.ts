import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  CorporatePartner,
  CorporatePartnerCreateInput,
  CorporatePartnerListFilter,
  CorporatePartnerUpdateInput,
} from '@/entities/corporate-partner/model/types'
import { useAdminInfiniteList } from '@/shared/hooks/use-admin-infinite-list'
import {
  collectInfiniteCachedRows,
  flattenAdminListCache,
  patchInfiniteListRow,
  readAdminListCacheTotalCount,
  removeInfiniteListRows,
} from '@/shared/lib/admin-infinite-list'
import { shouldUseCorporatePartnerRemoteApi } from './capabilities'
import { corporatePartnerQueryKeys } from './query-keys'
import {
  createCorporatePartnerService,
  listCorporatePartnersPageService,
  removeCorporatePartnersService,
  reorderCorporatePartnersService,
  setCorporatePartnerPublicService,
  updateCorporatePartnerService,
} from './service'

function source(): 'remote' | 'local' {
  return shouldUseCorporatePartnerRemoteApi() ? 'remote' : 'local'
}

function filterKey(filter?: CorporatePartnerListFilter): string {
  return JSON.stringify({
    pub: filter?.isPublic ?? '',
    name: filter?.name ?? '',
    from: filter?.registeredFrom ?? '',
    to: filter?.registeredTo ?? '',
  })
}

/**
 * 해당 필터로 캐시에 있는 행 — 무한 캐시와 페이지 단위 캐시(`listPage`)를 모두 합친다.
 * `list(source, filterKey)`가 `listPage(...)`의 접두 키라 prefix 조회로 둘 다 잡힌다.
 */
function cachedRowsFor(
  queryClient: ReturnType<typeof useQueryClient>,
  filter?: CorporatePartnerListFilter,
): { rows: CorporatePartner[]; totalCount: number } | undefined {
  const merged = new Map<string, CorporatePartner>()
  let totalCount: number | undefined
  for (const [, data] of queryClient.getQueriesData({
    queryKey: corporatePartnerQueryKeys.list(source(), filterKey(filter)),
  })) {
    for (const row of flattenAdminListCache<CorporatePartner>(data)) merged.set(row.id, row)
    totalCount = readAdminListCacheTotalCount(data) ?? totalCount
  }
  if (merged.size === 0) return undefined
  return { rows: [...merged.values()], totalCount: totalCount ?? merged.size }
}

function cachedRows(
  queryClient: ReturnType<typeof useQueryClient>,
  filter?: CorporatePartnerListFilter,
): CorporatePartner[] | undefined {
  return cachedRowsFor(queryClient, filter)?.rows
}

function allCachedRows(queryClient: ReturnType<typeof useQueryClient>): CorporatePartner[] {
  return (
    collectInfiniteCachedRows<CorporatePartner>(queryClient, corporatePartnerQueryKeys.lists()) ?? []
  )
}

function partnerMatchesListFilter(
  row: CorporatePartner,
  filter?: CorporatePartnerListFilter,
): boolean {
  if (!filter) return true
  if (filter.isPublic === true && !row.isPublic) return false
  if (filter.isPublic === false && row.isPublic) return false
  const nameQ = filter.name?.trim().toLowerCase()
  if (nameQ && !row.name.toLowerCase().includes(nameQ)) return false
  const created = row.createdAt?.slice(0, 10) ?? ''
  if (filter.registeredFrom && created < filter.registeredFrom) return false
  if (filter.registeredTo && created > filter.registeredTo) return false
  return true
}

function patchPartnerInLists(
  queryClient: ReturnType<typeof useQueryClient>,
  partner: CorporatePartner,
  /** 현재 화면 필터 — 조건 불일치 행은 해당 캐시에서 제거 */
  activeFilter?: CorporatePartnerListFilter,
) {
  patchInfiniteListRow(queryClient, corporatePartnerQueryKeys.lists(), partner)

  if (!activeFilter) return
  if (partnerMatchesListFilter(partner, activeFilter)) return

  removeInfiniteListRows(
    queryClient,
    corporatePartnerQueryKeys.list(source(), filterKey(activeFilter)),
    [partner.id],
  )
}

export function useCorporatePartnersList(
  filter?: CorporatePartnerListFilter,
  enabled = true,
) {
  return useAdminInfiniteList({
    queryKey: corporatePartnerQueryKeys.list(source(), filterKey(filter)),
    enabled,
    isRemote: shouldUseCorporatePartnerRemoteApi(),
    fetchPage: page => listCorporatePartnersPageService(filter, page),
  })
}

/**
 * 페이지 단위 목록 — 후원사 목록 화면 (Figma 36:47073: 한 화면 50건 + 페이지 이동).
 * 페이지를 넘기는 동안 이전 페이지를 유지해 표가 깜빡이지 않게 한다.
 */
export function useCorporatePartnersPagedList(
  filter: CorporatePartnerListFilter | undefined,
  page: number,
  enabled = true,
) {
  const dataSource = source()
  return useQuery({
    queryKey: corporatePartnerQueryKeys.listPage(dataSource, filterKey(filter), page),
    queryFn: () => listCorporatePartnersPageService(filter, page),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: dataSource === 'remote' ? 30_000 : Number.POSITIVE_INFINITY,
    retry: dataSource === 'remote' ? 1 : false,
  })
}

/** 전체 목록 (필터 없음) — 총 건수·reorder merge 용 */
export function useCorporatePartnersAll(enabled = true) {
  return useCorporatePartnersList(undefined, enabled)
}

export function useCreateCorporatePartner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CorporatePartnerCreateInput) => createCorporatePartnerService(input),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: corporatePartnerQueryKeys.lists() })
    },
  })
}

export function useUpdateCorporatePartner(filter?: CorporatePartnerListFilter) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: CorporatePartnerUpdateInput }) =>
      updateCorporatePartnerService(id, patch, cachedRows(queryClient, filter)),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: corporatePartnerQueryKeys.lists() })
    },
  })
}

export function useRemoveCorporatePartners(filter?: CorporatePartnerListFilter) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => {
      const cached = cachedRows(queryClient, filter)
      return removeCorporatePartnersService(ids, cached ?? allCachedRows(queryClient))
    },
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: corporatePartnerQueryKeys.lists() })
    },
  })
}

export function useReorderCorporatePartners(_filter?: CorporatePartnerListFilter) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderedIds: string[]) => {
      // 필터 없는 전체 캐시 우선 (reorder는 전역 순서 기준) — 캐시가 전체를 덮을 때만 GET 생략
      const unfiltered = cachedRowsFor(queryClient, undefined)
      const unfilteredComplete =
        unfiltered != null && unfiltered.rows.length >= unfiltered.totalCount
      return reorderCorporatePartnersService(
        orderedIds,
        unfilteredComplete ? unfiltered.rows : undefined,
      )
    },
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: corporatePartnerQueryKeys.lists() })
    },
  })
}

export function useSetCorporatePartnerPublic(filter?: CorporatePartnerListFilter) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isPublic }: { id: string; isPublic: boolean }) => {
      const cached = cachedRows(queryClient, filter)
      if (cached) {
        return setCorporatePartnerPublicService(id, isPublic, cached)
      }
      return setCorporatePartnerPublicService(id, isPublic, allCachedRows(queryClient))
    },
    retry: false,
    onSuccess: data => {
      patchPartnerInLists(queryClient, data, filter)
    },
  })
}
