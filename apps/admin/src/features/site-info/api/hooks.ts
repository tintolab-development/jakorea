import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { SiteInfo, SiteInfoSaveInput } from '@/entities/site-info/model/types'
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
    mutationFn: (input: SiteInfoSaveInput) => {
      const cached = queryClient.getQueryData<SiteInfo>(siteInfoQueryKeys.detail(source()))
      return saveSiteInfoService(input, cached)
    },
    retry: false,
    onSuccess: data => {
      // PUT이 전체 SiteInfo를 반환하므로 setQueryData만 — invalidate 금지
      queryClient.setQueryData(siteInfoQueryKeys.detail(source()), data)
    },
  })
}
