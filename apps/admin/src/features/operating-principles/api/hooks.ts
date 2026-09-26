import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  OperatingPrinciplesDoc,
  OperatingPrinciplesSavePayload,
} from '@/entities/operating-principles/model/types'
import { operatingPrinciplesQueryKeys } from './query-keys'
import {
  getOperatingPrinciplesService,
  reorderOperatingPrinciplesService,
  saveOperatingPrinciplesService,
  setPrincipleActiveService,
} from './service'

function cachedDoc(
  queryClient: ReturnType<typeof useQueryClient>,
): OperatingPrinciplesDoc | undefined {
  return queryClient.getQueryData<OperatingPrinciplesDoc>(
    operatingPrinciplesQueryKeys.detail(),
  )
}

export function useOperatingPrinciples(enabled = true) {
  return useQuery({
    queryKey: operatingPrinciplesQueryKeys.detail(),
    queryFn: () => getOperatingPrinciplesService(),
    enabled,
    staleTime: 30_000,
    retry: 1,
  })
}

export function useReorderOperatingPrinciples() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderedIds: string[]) =>
      reorderOperatingPrinciplesService(orderedIds, cachedDoc(queryClient)),
    retry: false,
    onSuccess: data => {
      queryClient.setQueryData(operatingPrinciplesQueryKeys.detail(), data)
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
      queryClient.setQueryData(operatingPrinciplesQueryKeys.detail(), data)
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
      queryClient.setQueryData(operatingPrinciplesQueryKeys.detail(), data)
    },
  })
}
