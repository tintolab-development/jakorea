import { useLayoutEffect, useMemo } from 'react'
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query'
import { shouldUseGeminiVisitingTrainingRemoteApi } from './capabilities'
import { geminiVisitingTrainingQueryKeys } from './query-keys'
import {
  getGeminiRecruitmentDetail,
  listGeminiApprovedTrainingsPage,
  listGeminiOrganizationApplicationsPage,
  listGeminiRecruitmentsPage,
  type GeminiApprovedTrainingsPage,
  type GeminiOrganizationApplicationsPage,
  type GeminiRecruitmentsPage,
} from './service'

type GeminiRecruitmentListFilters = {
  title?: string
  status?: string
  from?: string
  to?: string
}

type GeminiApprovedTrainingListFilters = {
  institutionName?: string
  institutionSido?: string
  institutionSigungu?: string
  status?: string
  officialDocumentRequired?: string
  trainingDateFrom?: string
  trainingDateTo?: string
}

type GeminiOrganizationApplicationListFilters = {
  institutionName?: string
  institutionSido?: string
  institutionSigungu?: string
  approvalStatus?: string
  teacherName?: string
}

function keepFirstInfiniteQueryPage<T>(
  data: InfiniteData<T> | undefined
): InfiniteData<T> | undefined {
  if (!data || data.pages.length <= 1) return data
  return {
    ...data,
    pages: data.pages.slice(0, 1),
    pageParams: data.pageParams.slice(0, 1),
  }
}

function useTrimInfiniteQueryPages<T>(
  queryKey: readonly unknown[],
  enabled: boolean
): void {
  const queryClient = useQueryClient()
  useLayoutEffect(() => {
    if (!enabled) return
    queryClient.setQueryData<InfiniteData<T>>(queryKey, keepFirstInfiniteQueryPage)
  }, [enabled, queryClient, queryKey])
}

export function useGeminiRecruitmentsQuery(
  filters: GeminiRecruitmentListFilters = {},
  enabled = true
) {
  const remoteEnabled = shouldUseGeminiVisitingTrainingRemoteApi()
  const filtersKey = JSON.stringify(filters)
  const queryKey = useMemo(
    () => geminiVisitingTrainingQueryKeys.recruitmentList(filtersKey),
    [filtersKey]
  )
  useTrimInfiniteQueryPages<GeminiRecruitmentsPage>(queryKey, enabled && remoteEnabled)
  return useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) =>
      listGeminiRecruitmentsPage(
        {
          keyword: filters.title?.trim() || undefined,
          periodStatus:
            filters.status && filters.status !== 'ALL' ? filters.status : undefined,
        },
        pageParam as number
      ),
    initialPageParam: 0,
    getNextPageParam: lastPage => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    enabled,
    staleTime: remoteEnabled ? 30_000 : Number.POSITIVE_INFINITY,
    retry: false,
  })
}

export function useGeminiRecruitmentDetailQuery(
  programId: string | undefined,
  enabled = true
) {
  return useQuery({
    queryKey: geminiVisitingTrainingQueryKeys.recruitmentDetail(programId ?? ''),
    queryFn: () => getGeminiRecruitmentDetail(programId!),
    enabled: enabled && Boolean(programId),
    staleTime: 30_000,
    retry: false,
  })
}

export function useGeminiOrganizationApplicationsQuery(
  programId: string | undefined,
  filters: GeminiOrganizationApplicationListFilters = {},
  enabled = true
) {
  const filtersKey = JSON.stringify(filters)
  const queryKey = useMemo(
    () =>
      geminiVisitingTrainingQueryKeys.organizationApplications(
        programId ?? '',
        filtersKey
      ),
    [filtersKey, programId]
  )
  useTrimInfiniteQueryPages<GeminiOrganizationApplicationsPage>(queryKey, enabled)
  return useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) =>
      listGeminiOrganizationApplicationsPage(
        programId!,
        filters.approvalStatus && filters.approvalStatus !== 'ALL'
          ? filters.approvalStatus
          : undefined,
        pageParam as number
      ),
    initialPageParam: 0,
    getNextPageParam: lastPage => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    enabled: enabled && Boolean(programId),
    staleTime: 30_000,
    retry: false,
  })
}

export function useGeminiApprovedTrainingsQuery(
  filters: GeminiApprovedTrainingListFilters = {},
  enabled = true
) {
  const remoteEnabled = shouldUseGeminiVisitingTrainingRemoteApi()
  const filtersKey = JSON.stringify(filters)
  const queryKey = useMemo(
    () => geminiVisitingTrainingQueryKeys.approvedList(filtersKey),
    [filtersKey]
  )
  useTrimInfiniteQueryPages<GeminiApprovedTrainingsPage>(queryKey, enabled && remoteEnabled)
  return useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) =>
      listGeminiApprovedTrainingsPage(
        filters.institutionName?.trim() || undefined,
        pageParam as number
      ),
    initialPageParam: 0,
    getNextPageParam: lastPage => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    enabled,
    staleTime: remoteEnabled ? 30_000 : Number.POSITIVE_INFINITY,
    retry: false,
  })
}
