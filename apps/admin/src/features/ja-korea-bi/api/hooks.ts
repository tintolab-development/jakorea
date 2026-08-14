import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { JaKoreaBi } from '@/entities/ja-korea-bi/model/types'
import { shouldUseJaKoreaBiRemoteApi } from './capabilities'
import { jaKoreaBiQueryKeys } from './query-keys'
import { getJaKoreaBiService, saveJaKoreaBiService } from './service'

function source(): 'remote' | 'local' {
  return shouldUseJaKoreaBiRemoteApi() ? 'remote' : 'local'
}

export function useJaKoreaBi(enabled = true) {
  const dataSource = source()
  return useQuery({
    queryKey: jaKoreaBiQueryKeys.detail(dataSource),
    queryFn: () => getJaKoreaBiService(),
    enabled,
    staleTime: dataSource === 'remote' ? 30_000 : Number.POSITIVE_INFINITY,
    retry: dataSource === 'remote' ? 1 : false,
  })
}

export function useSaveJaKoreaBi() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: JaKoreaBi) => saveJaKoreaBiService(data),
    retry: false,
    onSuccess: data => {
      // PUT 응답이 단건 전체(+version) — 추가 GET 없이 캐시 반영
      queryClient.setQueryData(jaKoreaBiQueryKeys.detail(source()), data)
    },
  })
}
