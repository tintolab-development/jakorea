import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  OperatingPrinciplesDoc,
  OperatingPrinciplesSavePayload,
} from '@/entities/operating-principles/model/types'
import { shouldUseOperatingPrinciplesRemoteApi } from './capabilities'
import { operatingPrinciplesQueryKeys } from './query-keys'
import {
  getOperatingPrinciplesService,
  reorderOperatingPrinciplesService,
  saveOperatingPrinciplesService,
  setPrincipleActiveService,
} from './service'

function source(): 'remote' | 'local' {
  return shouldUseOperatingPrinciplesRemoteApi() ? 'remote' : 'local'
}

function cachedDoc(
  queryClient: ReturnType<typeof useQueryClient>,
): OperatingPrinciplesDoc | undefined {
  return queryClient.getQueryData<OperatingPrinciplesDoc>(
    operatingPrinciplesQueryKeys.detail(source()),
  )
}

export function useOperatingPrinciples(enabled = true) {
  const dataSource = source()
  return useQuery({
    queryKey: operatingPrinciplesQueryKeys.detail(dataSource),
    queryFn: () => getOperatingPrinciplesService(),
    enabled,
    staleTime: dataSource === 'remote' ? 30_000 : Number.POSITIVE_INFINITY,
    retry: dataSource === 'remote' ? 1 : false,
  })
}

export function useReorderOperatingPrinciples() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderedIds: string[]) =>
      reorderOperatingPrinciplesService(orderedIds, cachedDoc(queryClient)),
    retry: false,
    onSuccess: data => {
      queryClient.setQueryData(operatingPrinciplesQueryKeys.detail(source()), data)
    },
  })
}

export function useSetPrincipleActive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setPrincipleActiveService(id, isActive, cachedDoc(queryClient)),
    retry: false,
    onSuccess: data => {
      queryClient.setQueryData(operatingPrinciplesQueryKeys.detail(source()), data)
    },
  })
}

export function useSaveOperatingPrinciples() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: OperatingPrinciplesSavePayload) =>
      saveOperatingPrinciplesService(payload, cachedDoc(queryClient)),
    retry: false,
    onSuccess: data => {
      queryClient.setQueryData(operatingPrinciplesQueryKeys.detail(source()), data)
    },
  })
}
