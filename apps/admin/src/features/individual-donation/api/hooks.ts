import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  BannerSaveInput,
  DonateCtaSaveInput,
  IndividualDonationData,
  UsageGuideSaveItem,
} from '@/entities/individual-donation/model/types'
import { shouldUseIndividualDonationRemoteApi } from './capabilities'
import { individualDonationQueryKeys } from './query-keys'
import {
  getIndividualDonationService,
  saveBannerService,
  saveDonateCtaService,
  saveUsageGuideService,
} from './service'

function source(): 'remote' | 'local' {
  return shouldUseIndividualDonationRemoteApi() ? 'remote' : 'local'
}

function cachedDetail(
  queryClient: ReturnType<typeof useQueryClient>,
): IndividualDonationData | undefined {
  return queryClient.getQueryData<IndividualDonationData>(
    individualDonationQueryKeys.detail(source()),
  )
}

export function useIndividualDonation(enabled = true) {
  const dataSource = source()
  return useQuery({
    queryKey: individualDonationQueryKeys.detail(dataSource),
    queryFn: () => getIndividualDonationService(),
    enabled,
    staleTime: dataSource === 'remote' ? 30_000 : Number.POSITIVE_INFINITY,
    retry: dataSource === 'remote' ? 1 : false,
  })
}

function useSetDonationCache() {
  const queryClient = useQueryClient()
  return (data: IndividualDonationData) => {
    queryClient.setQueryData(individualDonationQueryKeys.detail(source()), data)
  }
}

export function useSaveBanner() {
  const queryClient = useQueryClient()
  const setCache = useSetDonationCache()
  return useMutation({
    mutationFn: (input: BannerSaveInput) => saveBannerService(input, cachedDetail(queryClient)),
    retry: false,
    onSuccess: data => setCache(data),
  })
}

export function useSaveUsageGuide() {
  const queryClient = useQueryClient()
  const setCache = useSetDonationCache()
  return useMutation({
    mutationFn: (items: UsageGuideSaveItem[]) =>
      saveUsageGuideService(items, cachedDetail(queryClient)),
    retry: false,
    onSuccess: data => setCache(data),
  })
}

export function useSaveDonateCta() {
  const queryClient = useQueryClient()
  const setCache = useSetDonationCache()
  return useMutation({
    mutationFn: (input: DonateCtaSaveInput) =>
      saveDonateCtaService(input, cachedDetail(queryClient)),
    retry: false,
    onSuccess: data => setCache(data),
  })
}
