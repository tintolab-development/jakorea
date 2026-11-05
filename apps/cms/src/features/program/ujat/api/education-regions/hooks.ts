import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  UjatEducationRegionFilters,
  UjatEducationRegionUpdateInput,
} from '@/features/program/ujat/model/education-region.types'
import { shouldUseUjatEducationRegionsRemoteApi } from './capabilities'
import {
  applyCreatedEducationRegion,
  applyDeletedEducationRegion,
  applyUpdatedEducationRegion,
} from './list-cache'
import { ujatEducationRegionQueryKeys } from './query-keys'
import {
  listUjatEducationRegionsActiveRemoteService,
  listUjatEducationRegionsFilteredService,
  listUjatEducationRegionsService,
  createUjatEducationRegionService,
  deleteUjatEducationRegionService,
  reorderUjatEducationRegionsService,
  updateUjatEducationRegionService,
} from './service'

function source(): 'remote' | 'local' {
  return shouldUseUjatEducationRegionsRemoteApi() ? 'remote' : 'local'
}

/** Class A/B 참조 데이터 — mutation에서 목록을 패치하면 GET 생략 */
const REGION_STALE_TIME_MS = 15 * 60_000

export function useUjatEducationRegionsList(enabled = true) {
  const dataSource = source()
  return useQuery({
    queryKey: ujatEducationRegionQueryKeys.list(dataSource),
    queryFn: () => listUjatEducationRegionsService(),
    enabled,
    staleTime: dataSource === 'remote' ? REGION_STALE_TIME_MS : Number.POSITIVE_INFINITY,
    retry: dataSource === 'remote' ? 1 : false,
  })
}

/** 탭·필터 — GET ?activeYn=true */
export function useUjatEducationRegionsActiveList(enabled = true) {
  const dataSource = source()
  return useQuery({
    queryKey: ujatEducationRegionQueryKeys.activeList(dataSource),
    queryFn: () => listUjatEducationRegionsActiveRemoteService(),
    enabled,
    staleTime: dataSource === 'remote' ? REGION_STALE_TIME_MS : Number.POSITIVE_INFINITY,
    retry: dataSource === 'remote' ? 1 : false,
  })
}

function invalidateEducationRegionLists(queryClient: ReturnType<typeof useQueryClient>) {
  return queryClient.invalidateQueries({ queryKey: ujatEducationRegionQueryKeys.lists() })
}

/** 교육 지역 관리 테이블 — 조회 버튼으로 적용한 필터 기준 */
export function useUjatEducationRegionsFilteredList(filters: UjatEducationRegionFilters) {
  const dataSource = source()
  return useQuery({
    queryKey: ujatEducationRegionQueryKeys.filteredList(dataSource, filters),
    queryFn: () => listUjatEducationRegionsFilteredService(filters),
    placeholderData: keepPreviousData,
    retry: dataSource === 'remote' ? 1 : false,
  })
}

export function useCreateUjatEducationRegion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createUjatEducationRegionService,
    retry: false,
    onSuccess: created => {
      applyCreatedEducationRegion(queryClient, source(), created)
    },
    onSettled: () => {
      void invalidateEducationRegionLists(queryClient)
      return queryClient.invalidateQueries({
        queryKey: ujatEducationRegionQueryKeys.filteredLists(),
      })
    },
  })
}

export function useUpdateUjatEducationRegion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string
      patch: UjatEducationRegionUpdateInput
    }) => updateUjatEducationRegionService(id, patch),
    retry: false,
    onSuccess: updated => {
      applyUpdatedEducationRegion(queryClient, source(), updated)
    },
    onSettled: () => {
      void invalidateEducationRegionLists(queryClient)
      return queryClient.invalidateQueries({
        queryKey: ujatEducationRegionQueryKeys.filteredLists(),
      })
    },
  })
}

export function useDeleteUjatEducationRegion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteUjatEducationRegionService(id),
    retry: false,
    onSuccess: (result, id) => {
      if (result.ok !== true) return
      applyDeletedEducationRegion(queryClient, source(), id)
    },
    onSettled: () => {
      void invalidateEducationRegionLists(queryClient)
      return queryClient.invalidateQueries({
        queryKey: ujatEducationRegionQueryKeys.filteredLists(),
      })
    },
  })
}

export function useReorderUjatEducationRegions() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderedIds: string[]) => reorderUjatEducationRegionsService(orderedIds),
    retry: false,
    onSuccess: rows => {
      queryClient.setQueryData(ujatEducationRegionQueryKeys.list(source()), rows)
      queryClient.setQueryData(
        ujatEducationRegionQueryKeys.activeList(source()),
        rows.filter(row => row.active && row.regionKey.trim())
      )
    },
    onSettled: () => {
      void invalidateEducationRegionLists(queryClient)
      return queryClient.invalidateQueries({
        queryKey: ujatEducationRegionQueryKeys.filteredLists(),
      })
    },
  })
}
