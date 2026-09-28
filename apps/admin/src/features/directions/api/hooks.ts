import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { DirectionsInfo } from '@/entities/directions/model/types'
import { directionsQueryKeys } from './query-keys'
import { getDirectionsService, saveDirectionsService } from './service'

export function useDirections(enabled = true) {
  return useQuery({
    queryKey: directionsQueryKeys.detail(),
    queryFn: () => getDirectionsService(),
    enabled,
    staleTime: 30_000,
    gcTime: 15 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 1,
  })
}

export function useSaveDirections() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: DirectionsInfo) => saveDirectionsService(data),
    retry: false,
    onSuccess: data => {
      // PUT 응답이 단건 전체(+version) — 추가 GET 없이 캐시 반영
      queryClient.setQueryData(directionsQueryKeys.detail(), data)
    },
  })
}
