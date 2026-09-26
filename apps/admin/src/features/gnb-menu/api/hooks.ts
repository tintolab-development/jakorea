import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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

export function useSaveGnbMenu() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (doc: GnbMenuDoc) => saveGnbMenuService(doc),
    retry: false,
    onSuccess: data => {
      // PUT이 전체 GNB 문서를 반환하므로 setQueryData만 — invalidate 금지
      queryClient.setQueryData(gnbMenuQueryKeys.detail(), data)
    },
  })
}
