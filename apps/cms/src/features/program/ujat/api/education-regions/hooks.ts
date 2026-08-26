import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { UjatEducationRegionUpdateInput } from '@/features/program/ujat/model/education-region.types'
import { shouldUseUjatEducationRegionsRemoteApi } from './capabilities'
import {
  applyCreatedEducationRegion,
  applyDeletedEducationRegion,
  applyUpdatedEducationRegion,
} from './list-cache'
import { ujatEducationRegionQueryKeys } from './query-keys'
import {
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

export function useCreateUjatEducationRegion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createUjatEducationRegionService,
    retry: false,
    onSuccess: created => {
      applyCreatedEducationRegion(queryClient, source(), created)
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
  })
}

export function useReorderUjatEducationRegions() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderedIds: string[]) => reorderUjatEducationRegionsService(orderedIds),
    retry: false,
    onSuccess: rows => {
      queryClient.setQueryData(ujatEducationRegionQueryKeys.list(source()), rows)
    },
  })
}
