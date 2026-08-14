import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ParticipateMenuLinks } from '@/entities/participate/model/types'
import { shouldUseParticipateRemoteApi } from './capabilities'
import { participateQueryKeys } from './query-keys'
import {
  getParticipateMenuLinksService,
  saveParticipateMenuLinksService,
} from './service'

function source(): 'remote' | 'local' {
  return shouldUseParticipateRemoteApi() ? 'remote' : 'local'
}

export function useParticipateMenuLinks(enabled = true) {
  const dataSource = source()
  return useQuery({
    queryKey: participateQueryKeys.menuLinksDetail(dataSource),
    queryFn: () => getParticipateMenuLinksService(),
    enabled,
    staleTime: dataSource === 'remote' ? 30_000 : Number.POSITIVE_INFINITY,
    retry: dataSource === 'remote' ? 1 : false,
  })
}

export function useSaveParticipateMenuLinks() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ParticipateMenuLinks) => saveParticipateMenuLinksService(data),
    retry: false,
    onSuccess: data => {
      // PUT 응답이 전체 2행(+version) — 추가 GET 없이 캐시 반영
      queryClient.setQueryData(participateQueryKeys.menuLinksDetail(source()), data)
    },
  })
}
