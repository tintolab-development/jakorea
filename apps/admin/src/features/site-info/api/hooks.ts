import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { SiteInfoSaveInput } from '@/entities/site-info/model/types'
import { shouldUseSiteInfoRemoteApi } from './capabilities'
import { siteInfoQueryKeys } from './query-keys'
import { getSiteInfoService, saveSiteInfoService } from './service'

function source(): 'remote' | 'local' {
  return shouldUseSiteInfoRemoteApi() ? 'remote' : 'local'
}

export function useSiteInfo(enabled = true) {
  const dataSource = source()
  return useQuery({
    queryKey: siteInfoQueryKeys.detail(dataSource),
    queryFn: () => getSiteInfoService(),
    enabled,
    staleTime: dataSource === 'remote' ? 30_000 : Number.POSITIVE_INFINITY,
    retry: dataSource === 'remote' ? 1 : false,
  })
}

export function useSaveSiteInfo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SiteInfoSaveInput) => saveSiteInfoService(input),
    retry: false,
    onSuccess: data => {
      queryClient.setQueryData(siteInfoQueryKeys.detail(source()), data)
      void queryClient.invalidateQueries({ queryKey: siteInfoQueryKeys.all })
    },
  })
}
