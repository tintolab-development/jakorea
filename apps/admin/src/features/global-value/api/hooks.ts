import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { GlobalValueTextPatch } from '@/entities/global-value/model/types'
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
    mutationFn: (orderedIds: string[]) => reorderGlobalValuesService(orderedIds),
    retry: false,
    onSuccess: rows => {
      queryClient.setQueryData(globalValueQueryKeys.list(source()), rows)
      void queryClient.invalidateQueries({ queryKey: globalValueQueryKeys.lists() })
    },
  })
}

export function useSetGlobalValueActive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setGlobalValueActiveService(id, isActive),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: globalValueQueryKeys.lists() })
    },
  })
}

export function useSaveGlobalValues() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (patches: GlobalValueTextPatch[]) => saveGlobalValuesService(patches),
    retry: false,
    onSuccess: rows => {
      queryClient.setQueryData(globalValueQueryKeys.list(source()), rows)
      void queryClient.invalidateQueries({ queryKey: globalValueQueryKeys.lists() })
    },
  })
}
