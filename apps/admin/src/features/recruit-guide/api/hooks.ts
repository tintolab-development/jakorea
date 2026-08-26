import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  BannerSaveInput,
  CultureSaveItem,
  InterviewSaveItem,
  RecruitGuideData,
} from '@/entities/recruit-guide/model/types'
import { shouldUseRecruitGuideRemoteApi } from './capabilities'
import { recruitGuideQueryKeys } from './query-keys'
import {
  addInterviewService,
  getRecruitGuideService,
  removeInterviewsService,
  replaceInterviewService,
  saveBannerService,
  saveCultureService,
} from './service'

function source(): 'remote' | 'local' {
  return shouldUseRecruitGuideRemoteApi() ? 'remote' : 'local'
}

export function useRecruitGuide(enabled = true) {
  const dataSource = source()
  return useQuery({
    queryKey: recruitGuideQueryKeys.detail(dataSource),
    queryFn: () => getRecruitGuideService(),
    enabled,
    staleTime: dataSource === 'remote' ? 30_000 : Number.POSITIVE_INFINITY,
    retry: dataSource === 'remote' ? 1 : false,
  })
}

function useSetGuideCache() {
  const queryClient = useQueryClient()
  return (data: RecruitGuideData) => {
    queryClient.setQueryData(recruitGuideQueryKeys.detail(source()), data)
  }
}

export function useSaveRecruitBanner() {
  const setCache = useSetGuideCache()
  return useMutation({
    mutationFn: (input: BannerSaveInput) => saveBannerService(input),
    retry: false,
    onSuccess: data => setCache(data),
  })
}

export function useSaveRecruitCulture() {
  const setCache = useSetGuideCache()
  return useMutation({
    mutationFn: (items: CultureSaveItem[]) => saveCultureService(items),
    retry: false,
    onSuccess: data => setCache(data),
  })
}

export function useAddRecruitInterview() {
  const setCache = useSetGuideCache()
  return useMutation({
    mutationFn: (input: InterviewSaveItem) => addInterviewService(input),
    retry: false,
    onSuccess: data => setCache(data),
  })
}

export function useReplaceRecruitInterview() {
  const setCache = useSetGuideCache()
  return useMutation({
    mutationFn: (payload: { id: string; input: InterviewSaveItem }) =>
      replaceInterviewService(payload.id, payload.input),
    retry: false,
    onSuccess: data => setCache(data),
  })
}

export function useRemoveRecruitInterviews() {
  const setCache = useSetGuideCache()
  return useMutation({
    mutationFn: (ids: string[]) => removeInterviewsService(ids),
    retry: false,
    onSuccess: data => setCache(data),
  })
}
