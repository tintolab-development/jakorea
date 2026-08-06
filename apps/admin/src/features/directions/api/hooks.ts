import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { DirectionsInfo } from '@/entities/directions/model/types'
import { shouldUseDirectionsRemoteApi } from './capabilities'
import { directionsQueryKeys } from './query-keys'
import { getDirectionsService, saveDirectionsService } from './service'

function source(): 'remote' | 'local' {
  return shouldUseDirectionsRemoteApi() ? 'remote' : 'local'
}

export function useDirections(enabled = true) {
  const dataSource = source()
  return useQuery({
    queryKey: directionsQueryKeys.detail(dataSource),
    queryFn: () => getDirectionsService(),
    enabled,
    staleTime: dataSource === 'remote' ? 30_000 : Number.POSITIVE_INFINITY,
    retry: dataSource === 'remote' ? 1 : false,
  })
}

export function useSaveDirections() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: DirectionsInfo) => saveDirectionsService(data),
    retry: false,
    onSuccess: data => {
      queryClient.setQueryData(directionsQueryKeys.detail(source()), data)
      void queryClient.invalidateQueries({ queryKey: directionsQueryKeys.all })
    },
  })
}
