import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { JaKoreaWorldwide } from '@/entities/ja-korea-worldwide/model/types'
import { shouldUseJaKoreaWorldwideRemoteApi } from './capabilities'
import { jaKoreaWorldwideQueryKeys } from './query-keys'
import {
  getJaKoreaWorldwideService,
  saveJaKoreaWorldwideService,
} from './service'

function source(): 'remote' | 'local' {
  return shouldUseJaKoreaWorldwideRemoteApi() ? 'remote' : 'local'
}

export function useJaKoreaWorldwide(enabled = true) {
  const dataSource = source()
  return useQuery({
    queryKey: jaKoreaWorldwideQueryKeys.detail(dataSource),
    queryFn: () => getJaKoreaWorldwideService(),
    enabled,
    staleTime: dataSource === 'remote' ? 30_000 : Number.POSITIVE_INFINITY,
    retry: dataSource === 'remote' ? 1 : false,
  })
}

export function useSaveJaKoreaWorldwide() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: JaKoreaWorldwide) => saveJaKoreaWorldwideService(data),
    retry: false,
    onSuccess: data => {
      queryClient.setQueryData(jaKoreaWorldwideQueryKeys.detail(source()), data)
      void queryClient.invalidateQueries({ queryKey: jaKoreaWorldwideQueryKeys.all })
    },
  })
}
