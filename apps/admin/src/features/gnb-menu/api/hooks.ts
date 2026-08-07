import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { GnbMenuDoc } from '@/entities/gnb-menu/model/types'
import { shouldUseGnbMenuRemoteApi } from './capabilities'
import { gnbMenuQueryKeys } from './query-keys'
import { getGnbMenuService, saveGnbMenuService } from './service'

function source(): 'remote' | 'local' {
  return shouldUseGnbMenuRemoteApi() ? 'remote' : 'local'
}

export function useGnbMenu(enabled = true) {
  const dataSource = source()
  return useQuery({
    queryKey: gnbMenuQueryKeys.detail(dataSource),
    queryFn: () => getGnbMenuService(),
    enabled,
    staleTime: dataSource === 'remote' ? 30_000 : Number.POSITIVE_INFINITY,
    retry: dataSource === 'remote' ? 1 : false,
  })
}

export function useSaveGnbMenu() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (doc: GnbMenuDoc) => saveGnbMenuService(doc),
    retry: false,
    onSuccess: data => {
      queryClient.setQueryData(gnbMenuQueryKeys.detail(source()), data)
      void queryClient.invalidateQueries({ queryKey: gnbMenuQueryKeys.all })
    },
  })
}
