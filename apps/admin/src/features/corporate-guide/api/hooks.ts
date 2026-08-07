import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  BannerSaveInput,
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

function useInvalidateGuide() {
  const queryClient = useQueryClient()
  return (data: Awaited<ReturnType<typeof getCorporateGuideService>>) => {
    queryClient.setQueryData(corporateGuideQueryKeys.detail(source()), data)
    void queryClient.invalidateQueries({ queryKey: corporateGuideQueryKeys.all })
  }
}

export function useSaveCorporateBanner() {
  const setCache = useInvalidateGuide()
  return useMutation({
    mutationFn: (input: BannerSaveInput) => saveBannerService(input),
    retry: false,
    onSuccess: data => setCache(data),
  })
}

export function useSaveMetrics() {
  const setCache = useInvalidateGuide()
  return useMutation({
    mutationFn: (items: MetricSaveItem[]) => saveMetricsService(items),
    retry: false,
    onSuccess: data => setCache(data),
  })
}

export function useSavePartnership() {
  const setCache = useInvalidateGuide()
  return useMutation({
    mutationFn: (items: PartnershipSaveItem[]) => savePartnershipService(items),
    retry: false,
    onSuccess: data => setCache(data),
  })
}
