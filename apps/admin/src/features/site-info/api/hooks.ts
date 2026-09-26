import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { SiteInfo, SiteInfoSaveInput } from '@/entities/site-info/model/types'
import { siteInfoQueryKeys } from './query-keys'
import { getSiteInfoService, saveSiteInfoService } from './service'

export function useSiteInfo(enabled = true) {
  return useQuery({
    queryKey: siteInfoQueryKeys.detail(),
    queryFn: () => getSiteInfoService(),
    enabled,
    staleTime: 30_000,
    gcTime: 15 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 1,
  })
}

export function useSaveSiteInfo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SiteInfoSaveInput) => {
      const cached = queryClient.getQueryData<SiteInfo>(siteInfoQueryKeys.detail())
      return saveSiteInfoService(input, cached)
    },
    retry: false,
    onSuccess: data => {
      // PUT이 전체 SiteInfo를 반환하므로 setQueryData만 — invalidate 금지
      queryClient.setQueryData(siteInfoQueryKeys.detail(), data)
    },
  })
}
