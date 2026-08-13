import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  CorporatePartner,
  CorporatePartnerCreateInput,
  CorporatePartnerListFilter,
  CorporatePartnerListResult,
  CorporatePartnerUpdateInput,
} from '@/entities/corporate-partner/model/types'
import { shouldUseCorporatePartnerRemoteApi } from './capabilities'
import { corporatePartnerQueryKeys } from './query-keys'
import {
  createCorporatePartnerService,
  listCorporatePartnersService,
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

function cachedList(
  queryClient: ReturnType<typeof useQueryClient>,
  filter?: CorporatePartnerListFilter,
): CorporatePartnerListResult | undefined {
  return queryClient.getQueryData<CorporatePartnerListResult>(
    corporatePartnerQueryKeys.list(source(), filterKey(filter)),
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
  queryClient.setQueriesData<CorporatePartnerListResult>(
    { queryKey: corporatePartnerQueryKeys.lists() },
    old => {
      if (!old) return old
      const idx = old.items.findIndex(row => row.id === partner.id)
      if (idx < 0) return old
      const items = [...old.items]
      items[idx] = partner
      return { ...old, items }
    },
  )

  if (!activeFilter) return
  if (partnerMatchesListFilter(partner, activeFilter)) return

  queryClient.setQueryData(
    corporatePartnerQueryKeys.list(source(), filterKey(activeFilter)),
    (old: CorporatePartnerListResult | undefined) => {
      if (!old) return old
      const items = old.items.filter(row => row.id !== partner.id)
      if (items.length === old.items.length) return old
      return {
        items,
        totalCount: Math.max(0, (old.totalCount ?? old.items.length) - 1),
      }
    },
  )
}

export function useCorporatePartnersList(
  filter?: CorporatePartnerListFilter,
  enabled = true,
) {
  const dataSource = source()
  return useQuery({
    queryKey: corporatePartnerQueryKeys.list(dataSource, filterKey(filter)),
    queryFn: () => listCorporatePartnersService(filter),
    enabled,
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
      updateCorporatePartnerService(id, patch, cachedList(queryClient, filter)?.items),
    retry: false,
    onSuccess: data => {
      patchPartnerInLists(queryClient, data, filter)
    },
  })
}

export function useRemoveCorporatePartners(filter?: CorporatePartnerListFilter) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => {
      const cached = cachedList(queryClient, filter)?.items
      const merged = new Map<string, CorporatePartner>()
      for (const [, result] of queryClient.getQueriesData<CorporatePartnerListResult>({
        queryKey: corporatePartnerQueryKeys.lists(),
      })) {
        for (const row of result?.items ?? []) merged.set(row.id, row)
      }
      return removeCorporatePartnersService(ids, cached ?? [...merged.values()])
    },
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: corporatePartnerQueryKeys.lists() })
    },
  })
}

export function useReorderCorporatePartners(filter?: CorporatePartnerListFilter) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderedIds: string[]) => {
      // 필터 없는 전체 캐시 우선 (reorder는 전역 순서 기준)
      const unfiltered = cachedList(queryClient, undefined)?.items
      const filtered = cachedList(queryClient, filter)?.items
      return reorderCorporatePartnersService(orderedIds, unfiltered ?? filtered)
    },
    retry: false,
    onSuccess: rows => {
      queryClient.setQueryData(corporatePartnerQueryKeys.list(source(), filterKey(undefined)), {
        items: rows,
        totalCount: rows.length,
      })
      if (filterKey(filter) !== filterKey(undefined)) {
        queryClient.setQueryData(
          corporatePartnerQueryKeys.list(source(), filterKey(filter)),
          (old: CorporatePartnerListResult | undefined) => {
            if (!old) return { items: rows, totalCount: rows.length }
            const keep = new Set(old.items.map(row => row.id))
            const items = rows.filter(row => keep.has(row.id))
            return { items, totalCount: old.totalCount }
          },
        )
      }
    },
  })
}

export function useSetCorporatePartnerPublic(filter?: CorporatePartnerListFilter) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isPublic }: { id: string; isPublic: boolean }) => {
      const cached = cachedList(queryClient, filter)?.items
      if (cached) {
        return setCorporatePartnerPublicService(id, isPublic, cached)
      }
      const merged = new Map<string, CorporatePartner>()
      for (const [, result] of queryClient.getQueriesData<CorporatePartnerListResult>({
        queryKey: corporatePartnerQueryKeys.lists(),
      })) {
        for (const row of result?.items ?? []) merged.set(row.id, row)
      }
      return setCorporatePartnerPublicService(id, isPublic, [...merged.values()])
    },
    retry: false,
    onSuccess: data => {
      patchPartnerInLists(queryClient, data, filter)
    },
  })
}
