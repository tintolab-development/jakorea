import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query'
import type {
  CorporatePartner,
  CorporatePartnerCreateInput,
  CorporatePartnerListFilter,
  CorporatePartnerUpdateInput,
} from '@/entities/corporate-partner/model/types'
import { useAdminInfiniteList } from '@/shared/hooks/use-admin-infinite-list'
import {
  collectInfiniteCachedRows,
  flattenAdminListPages,
  patchInfiniteListRow,
  removeInfiniteListRows,
  type AdminListPage,
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

function cachedPages(
  queryClient: ReturnType<typeof useQueryClient>,
  filter?: CorporatePartnerListFilter,
): InfiniteData<AdminListPage<CorporatePartner>> | undefined {
  return queryClient.getQueryData<InfiniteData<AdminListPage<CorporatePartner>>>(
    corporatePartnerQueryKeys.list(source(), filterKey(filter)),
  )
}

/** 해당 필터로 지금까지 불러온 행 (무한 스크롤 페이지 합침) */
function cachedRows(
  queryClient: ReturnType<typeof useQueryClient>,
  filter?: CorporatePartnerListFilter,
): CorporatePartner[] | undefined {
  const data = cachedPages(queryClient, filter)
  return data ? flattenAdminListPages(data) : undefined
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
      // 필터 없는 전체 캐시 우선 (reorder는 전역 순서 기준)
      const unfilteredPages = cachedPages(queryClient, undefined)
      const unfiltered = unfilteredPages ? flattenAdminListPages(unfilteredPages) : undefined
      const unfilteredTotal = unfilteredPages?.pages[0]?.totalCount ?? 0
      const unfilteredComplete = unfiltered != null && unfiltered.length >= unfilteredTotal
      return reorderCorporatePartnersService(
        orderedIds,
        unfilteredComplete ? unfiltered : undefined,
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
