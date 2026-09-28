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
    // remote는 저장 API가 없어 세션 캐시 수정을 유지한다. 새로고침 시 서버 GET으로 복원.
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: false,
    retry: dataSource === 'remote' ? 1 : false,
  })
}

function useGuideCacheHelpers() {
  const queryClient = useQueryClient()
  const key = recruitGuideQueryKeys.detail(source())
  return {
    getCached: () => queryClient.getQueryData<RecruitGuideData>(key),
    setCache: (data: RecruitGuideData) => {
      queryClient.setQueryData(key, data)
    },
  }
}

export function useSaveRecruitBanner() {
  const { getCached, setCache } = useGuideCacheHelpers()
  return useMutation({
    mutationFn: (input: BannerSaveInput) => saveBannerService(input, getCached()),
    retry: false,
    onSuccess: data => setCache(data),
  })
}

export function useSaveRecruitCulture() {
  const { getCached, setCache } = useGuideCacheHelpers()
  return useMutation({
    mutationFn: (items: CultureSaveItem[]) => saveCultureService(items, getCached()),
    retry: false,
    onSuccess: data => setCache(data),
  })
}

export function useAddRecruitInterview() {
  const { getCached, setCache } = useGuideCacheHelpers()
  return useMutation({
    mutationFn: (input: InterviewSaveItem) => addInterviewService(input, getCached()),
    retry: false,
    onSuccess: data => setCache(data),
  })
}

export function useReplaceRecruitInterview() {
  const { getCached, setCache } = useGuideCacheHelpers()
  return useMutation({
    mutationFn: (payload: { id: string; input: InterviewSaveItem }) =>
      replaceInterviewService(payload.id, payload.input, getCached()),
    retry: false,
    onSuccess: data => setCache(data),
  })
}

export function useRemoveRecruitInterviews() {
  const { getCached, setCache } = useGuideCacheHelpers()
  return useMutation({
    mutationFn: (ids: string[]) => removeInterviewsService(ids, getCached()),
    retry: false,
    onSuccess: data => setCache(data),
  })
}
