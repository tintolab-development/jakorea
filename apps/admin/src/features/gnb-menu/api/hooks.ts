import { useIsMutating, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { GnbMenuDoc } from '@/entities/gnb-menu/model/types'
import { gnbMenuQueryKeys } from './query-keys'
import { getGnbMenuService, saveGnbMenuService } from './service'

export function useGnbMenu(enabled = true) {
  return useQuery({
    queryKey: gnbMenuQueryKeys.detail(),
    queryFn: () => getGnbMenuService(),
    enabled,
    staleTime: 30_000,
    gcTime: 15 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 1,
  })
}

/**
 * GNB 전체 PUT(20개 메뉴). 섹션 저장·조회 상태 토글/드래그 모두 이 mutation을 쓴다.
 * - 낙관적 반영: 드래그 직후 행이 원위치로 튀지 않게 캐시를 먼저 바꾸고, 실패 시 되돌린다.
 * - 성공: PUT 응답(전체 문서·새 version)으로 setQueryData만 — invalidate 금지.
 */
export function useSaveGnbMenu() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: gnbMenuQueryKeys.save(),
    mutationFn: (doc: GnbMenuDoc) => saveGnbMenuService(doc),
    retry: false,
    onMutate: async doc => {
      await queryClient.cancelQueries({ queryKey: gnbMenuQueryKeys.detail() })
      const previous = queryClient.getQueryData<GnbMenuDoc>(gnbMenuQueryKeys.detail())
      queryClient.setQueryData(gnbMenuQueryKeys.detail(), doc)
      return { previous }
    },
    onError: (_error, _doc, context) => {
      if (context?.previous) {
        queryClient.setQueryData(gnbMenuQueryKeys.detail(), context.previous)
      }
    },
    onSuccess: data => {
      queryClient.setQueryData(gnbMenuQueryKeys.detail(), data)
    },
  })
}

/** 어느 섹션이든 GNB 저장 중이면 true — 다른 섹션 저장·토글·드래그를 잠근다(전체 PUT 버전 충돌 방지) */
export function useIsGnbMenuSaving(): boolean {
  return useIsMutating({ mutationKey: gnbMenuQueryKeys.save() }) > 0
}
