import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { UjatEducationRegionUpdateInput } from '@/features/program/ujat/model/education-region.types'
import { shouldUseUjatEducationRegionsRemoteApi } from './capabilities'
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

export function useUjatEducationRegionsList(enabled = true) {
  const dataSource = source()
  return useQuery({
    queryKey: ujatEducationRegionQueryKeys.list(dataSource),
    queryFn: () => listUjatEducationRegionsService(),
    enabled,
    staleTime: dataSource === 'remote' ? 30_000 : Number.POSITIVE_INFINITY,
    retry: dataSource === 'remote' ? 1 : false,
  })
}

export function useCreateUjatEducationRegion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createUjatEducationRegionService,
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ujatEducationRegionQueryKeys.lists() })
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
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ujatEducationRegionQueryKeys.lists() })
    },
  })
}

export function useDeleteUjatEducationRegion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteUjatEducationRegionService(id),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ujatEducationRegionQueryKeys.lists() })
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
      void queryClient.invalidateQueries({ queryKey: ujatEducationRegionQueryKeys.lists() })
    },
  })
}
