import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  BannerSaveInput,
  HowSaveItem,
  InterviewSaveInput,
  TalentDonationIntroData,
} from '@/entities/talent-donation-intro/model/types'
import { shouldUseTalentDonationIntroRemoteApi } from './capabilities'
import { talentDonationIntroQueryKeys } from './query-keys'
import {
  getTalentDonationIntroService,
  saveBannerService,
  saveHowItemsService,
  saveInterviewService,
} from './service'

function source(): 'remote' | 'local' {
  return shouldUseTalentDonationIntroRemoteApi() ? 'remote' : 'local'
}

function cachedDetail(
  queryClient: ReturnType<typeof useQueryClient>,
): TalentDonationIntroData | undefined {
  return queryClient.getQueryData<TalentDonationIntroData>(
    talentDonationIntroQueryKeys.detail(source()),
  )
}

export function useTalentDonationIntro(enabled = true) {
  const dataSource = source()
  return useQuery({
    queryKey: talentDonationIntroQueryKeys.detail(dataSource),
    queryFn: () => getTalentDonationIntroService(),
    enabled,
    staleTime: dataSource === 'remote' ? 30_000 : Number.POSITIVE_INFINITY,
    retry: dataSource === 'remote' ? 1 : false,
  })
}

function useSetIntroCache() {
  const queryClient = useQueryClient()
  return (data: TalentDonationIntroData) => {
    queryClient.setQueryData(talentDonationIntroQueryKeys.detail(source()), data)
  }
}

export function useSaveBanner() {
  const queryClient = useQueryClient()
  const setCache = useSetIntroCache()
  return useMutation({
    mutationFn: (input: BannerSaveInput) => saveBannerService(input, cachedDetail(queryClient)),
    retry: false,
    onSuccess: data => setCache(data),
  })
}

export function useSaveHowItems() {
  const queryClient = useQueryClient()
  const setCache = useSetIntroCache()
  return useMutation({
    mutationFn: (items: HowSaveItem[]) => saveHowItemsService(items, cachedDetail(queryClient)),
    retry: false,
    onSuccess: data => setCache(data),
  })
}

export function useSaveInterview() {
  const queryClient = useQueryClient()
  const setCache = useSetIntroCache()
  return useMutation({
    mutationFn: (input: InterviewSaveInput) =>
      saveInterviewService(input, cachedDetail(queryClient)),
    retry: false,
    onSuccess: data => setCache(data),
  })
}
