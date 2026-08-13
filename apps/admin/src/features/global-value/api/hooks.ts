import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { GlobalValue, GlobalValueTextPatch } from '@/entities/global-value/model/types'
import { shouldUseGlobalValueRemoteApi } from './capabilities'
import { globalValueQueryKeys } from './query-keys'
import {
  listGlobalValuesService,
  reorderGlobalValuesService,
  saveGlobalValuesService,
  setGlobalValueActiveService,
} from './service'

function source(): 'remote' | 'local' {
  return shouldUseGlobalValueRemoteApi() ? 'remote' : 'local'
}

function cachedList(queryClient: ReturnType<typeof useQueryClient>): GlobalValue[] | undefined {
  return queryClient.getQueryData<GlobalValue[]>(globalValueQueryKeys.list(source()))
}

export function useGlobalValuesList(enabled = true) {
  const dataSource = source()
  return useQuery({
    queryKey: globalValueQueryKeys.list(dataSource),
    queryFn: () => listGlobalValuesService(),
    enabled,
    staleTime: dataSource === 'remote' ? 30_000 : Number.POSITIVE_INFINITY,
    retry: dataSource === 'remote' ? 1 : false,
  })
}

export function useReorderGlobalValues() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderedIds: string[]) =>
      reorderGlobalValuesService(orderedIds, cachedList(queryClient)),
    retry: false,
    onSuccess: rows => {
      queryClient.setQueryData(globalValueQueryKeys.list(source()), rows)
    },
  })
}

export function useSetGlobalValueActive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setGlobalValueActiveService(id, isActive, cachedList(queryClient)),
    retry: false,
    onSuccess: rows => {
      queryClient.setQueryData(globalValueQueryKeys.list(source()), rows)
    },
  })
}

export function useSaveGlobalValues() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (patches: GlobalValueTextPatch[]) =>
      saveGlobalValuesService(patches, cachedList(queryClient)),
    retry: false,
    onSuccess: rows => {
      queryClient.setQueryData(globalValueQueryKeys.list(source()), rows)
    },
  })
}
