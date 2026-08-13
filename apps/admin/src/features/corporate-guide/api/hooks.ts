import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  BannerSaveInput,
  CorporateGuideData,
  MetricSaveItem,
  PartnershipSaveItem,
} from '@/entities/corporate-guide/model/types'
import { shouldUseCorporateGuideRemoteApi } from './capabilities'
import { corporateGuideQueryKeys } from './query-keys'
import {
  getCorporateGuideService,
  saveBannerService,
  saveMetricsService,
  savePartnershipService,
} from './service'

function source(): 'remote' | 'local' {
  return shouldUseCorporateGuideRemoteApi() ? 'remote' : 'local'
}

function cachedDetail(
  queryClient: ReturnType<typeof useQueryClient>,
): CorporateGuideData | undefined {
  return queryClient.getQueryData<CorporateGuideData>(corporateGuideQueryKeys.detail(source()))
}

export function useCorporateGuide(enabled = true) {
  const dataSource = source()
  return useQuery({
    queryKey: corporateGuideQueryKeys.detail(dataSource),
    queryFn: () => getCorporateGuideService(),
    enabled,
    staleTime: dataSource === 'remote' ? 30_000 : Number.POSITIVE_INFINITY,
    retry: dataSource === 'remote' ? 1 : false,
  })
}

function useSetGuideCache() {
  const queryClient = useQueryClient()
  return (data: CorporateGuideData) => {
    queryClient.setQueryData(corporateGuideQueryKeys.detail(source()), data)
  }
}

export function useSaveCorporateBanner() {
  const queryClient = useQueryClient()
  const setCache = useSetGuideCache()
  return useMutation({
    mutationFn: (input: BannerSaveInput) => saveBannerService(input, cachedDetail(queryClient)),
    retry: false,
    onSuccess: data => setCache(data),
  })
}

export function useSaveMetrics() {
  const queryClient = useQueryClient()
  const setCache = useSetGuideCache()
  return useMutation({
    mutationFn: (items: MetricSaveItem[]) => saveMetricsService(items, cachedDetail(queryClient)),
    retry: false,
    onSuccess: data => setCache(data),
  })
}

export function useSavePartnership() {
  const queryClient = useQueryClient()
  const setCache = useSetGuideCache()
  return useMutation({
    mutationFn: (items: PartnershipSaveItem[]) =>
      savePartnershipService(items, cachedDetail(queryClient)),
    retry: false,
    onSuccess: data => setCache(data),
  })
}
