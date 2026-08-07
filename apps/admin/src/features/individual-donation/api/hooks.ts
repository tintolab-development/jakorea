import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  BannerSaveInput,
  DonateCtaSaveInput,
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

function useInvalidateDonation() {
  const queryClient = useQueryClient()
  return (data: Awaited<ReturnType<typeof getIndividualDonationService>>) => {
    queryClient.setQueryData(individualDonationQueryKeys.detail(source()), data)
    void queryClient.invalidateQueries({ queryKey: individualDonationQueryKeys.all })
  }
}

export function useSaveBanner() {
  const setCache = useInvalidateDonation()
  return useMutation({
    mutationFn: (input: BannerSaveInput) => saveBannerService(input),
    retry: false,
    onSuccess: data => setCache(data),
  })
}

export function useSaveUsageGuide() {
  const setCache = useInvalidateDonation()
  return useMutation({
    mutationFn: (items: UsageGuideSaveItem[]) => saveUsageGuideService(items),
    retry: false,
    onSuccess: data => setCache(data),
  })
}

export function useSaveDonateCta() {
  const setCache = useInvalidateDonation()
  return useMutation({
    mutationFn: (input: DonateCtaSaveInput) => saveDonateCtaService(input),
    retry: false,
    onSuccess: data => setCache(data),
  })
}
