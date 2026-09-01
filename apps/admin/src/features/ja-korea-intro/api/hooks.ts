import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { JaKoreaIntro } from '@/entities/ja-korea-intro/model/types'
import { shouldUseJaKoreaIntroRemoteApi } from './capabilities'
import { jaKoreaIntroQueryKeys } from './query-keys'
import { getJaKoreaIntroService, saveJaKoreaIntroService } from './service'

function source(): 'remote' | 'local' {
  return shouldUseJaKoreaIntroRemoteApi() ? 'remote' : 'local'
}

export function useJaKoreaIntro(enabled = true) {
  const dataSource = source()
  return useQuery({
    queryKey: jaKoreaIntroQueryKeys.detail(dataSource),
    queryFn: () => getJaKoreaIntroService(),
    enabled,
    staleTime: dataSource === 'remote' ? 30_000 : Number.POSITIVE_INFINITY,
    retry: dataSource === 'remote' ? 1 : false,
  })
}

export function useSaveJaKoreaIntro() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: JaKoreaIntro) => saveJaKoreaIntroService(data),
    retry: false,
    onSuccess: data => {
      // PUT 응답이 단건 전체(+version) — 추가 GET 없이 캐시 반영
      queryClient.setQueryData(jaKoreaIntroQueryKeys.detail(source()), data)
    },
  })
}
