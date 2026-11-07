import { useLayoutEffect, useMemo } from 'react'
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from '@tanstack/react-query'
import { geminiApprovedTrainingService } from '../approved-training-service'
import { shouldUseGeminiVisitingTrainingRemoteApi } from './capabilities'
import { geminiVisitingTrainingQueryKeys } from './query-keys'
import { mapGeminiRecruitmentUiStatusToPeriodStatusWire } from '../../lib/recruitment/map-period-status-wire'
import { updateTeacherEmploymentStatusRemote } from '@/features/user/api/members-api-client'
import type { SchoolTeacherEmploymentStatus } from '@/types/user'
import {
  approveGeminiInstructorApplication,
  getGeminiApprovedTrainingDetail,
  getGeminiRecruitmentDetail,
  listGeminiApprovedInstructorApplicationsPage,
  listGeminiApprovedTrainingsPage,
  listGeminiOrganizationApplicationsPage,
  listGeminiRecruitmentsPage,
  rejectGeminiInstructorApplication,
  resendGeminiInstructorApplicationNotification,
  type GeminiApprovedTrainingsPage,
  type GeminiInstructorApplicationsPage,
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

export type GeminiOrganizationApplicationListFilters = {
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
          periodStatus: mapGeminiRecruitmentUiStatusToPeriodStatusWire(filters.status),
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
        {
          status:
            filters.approvalStatus && filters.approvalStatus !== 'ALL'
              ? filters.approvalStatus
              : undefined,
          organizationName: filters.institutionName?.trim() || undefined,
          regionSido: filters.institutionSido?.trim() || undefined,
          regionSigungu: filters.institutionSigungu?.trim() || undefined,
          teacherName: filters.teacherName?.trim() || undefined,
        },
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
        {
          keyword: filters.institutionName?.trim() || undefined,
          institutionSido: filters.institutionSido || undefined,
          institutionSigungu: filters.institutionSigungu || undefined,
          status: filters.status || undefined,
          officialDocumentRequired:
            filters.officialDocumentRequired === 'Y'
              ? true
              : filters.officialDocumentRequired === 'N'
                ? false
                : undefined,
          trainingDateFrom: filters.trainingDateFrom || undefined,
          trainingDateTo: filters.trainingDateTo || undefined,
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

export function useGeminiApprovedTrainingDetailQuery(
  approvedTrainingId: string | undefined,
  enabled = true
) {
  return useQuery({
    queryKey: geminiVisitingTrainingQueryKeys.approvedDetail(approvedTrainingId ?? ''),
    queryFn: () => getGeminiApprovedTrainingDetail(approvedTrainingId!),
    enabled: enabled && Boolean(approvedTrainingId),
    staleTime: 30_000,
    retry: false,
  })
}

export type GeminiInstructorApplicationListFilters = {
  instructorName?: string
  homeSido?: string
  homeSigungu?: string
  experienceYears?: string
  grade?: string
  approvalStatus?: string
}

export function useGeminiApprovedInstructorApplicationsQuery(
  approvedTrainingId: string | undefined,
  filters: GeminiInstructorApplicationListFilters = {},
  enabled = true
) {
  const filtersKey = JSON.stringify(filters)
  const queryKey = useMemo(
    () =>
      geminiVisitingTrainingQueryKeys.approvedInstructorApplications(
        approvedTrainingId ?? '',
        filtersKey
      ),
    [approvedTrainingId, filtersKey]
  )
  useTrimInfiniteQueryPages<GeminiInstructorApplicationsPage>(
    queryKey,
    enabled && Boolean(approvedTrainingId)
  )
  return useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) =>
      listGeminiApprovedInstructorApplicationsPage(
        approvedTrainingId!,
        {
          status:
            filters.approvalStatus && filters.approvalStatus !== 'ALL'
              ? filters.approvalStatus
              : undefined,
          instructorName: filters.instructorName?.trim() || undefined,
          homeSido: filters.homeSido?.trim() || undefined,
          homeSigungu: filters.homeSigungu?.trim() || undefined,
          experienceYears:
            filters.experienceYears && filters.experienceYears !== 'ALL'
              ? filters.experienceYears
              : undefined,
          grade: filters.grade && filters.grade !== 'ALL' ? filters.grade : undefined,
        },
        pageParam as number
      ),
    initialPageParam: 0,
    getNextPageParam: lastPage => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    enabled: enabled && Boolean(approvedTrainingId),
    staleTime: 30_000,
    retry: false,
  })
}

async function invalidateGeminiInstructorApprovalQueries(
  queryClient: QueryClient,
  approvedTrainingId: string
) {
  await queryClient.invalidateQueries({
    queryKey: geminiVisitingTrainingQueryKeys.approvedInstructorApplications(approvedTrainingId),
  })
  await queryClient.invalidateQueries({
    queryKey: geminiVisitingTrainingQueryKeys.approvedDetail(approvedTrainingId),
  })
  await queryClient.invalidateQueries({
    queryKey: geminiVisitingTrainingQueryKeys.approvedList(),
  })
}

export function usePatchGeminiApprovedTeacherEmploymentMutation(approvedTrainingId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      teacherSchoolOrganizationId: number
      teacherMemberId: number
      employmentStatus: SchoolTeacherEmploymentStatus
    }) =>
      updateTeacherEmploymentStatusRemote(
        input.teacherSchoolOrganizationId,
        input.teacherMemberId,
        input.employmentStatus
      ),
    retry: false,
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: geminiVisitingTrainingQueryKeys.approvedDetail(approvedTrainingId),
      })
    },
  })
}

export function useApproveGeminiInstructorApplicationMutation(approvedTrainingId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { applicationId: string; replacement?: boolean }) =>
      approveGeminiInstructorApplication(input.applicationId, {
        replacement: input.replacement,
      }),
    retry: false,
    onSuccess: async () => {
      await invalidateGeminiInstructorApprovalQueries(queryClient, approvedTrainingId)
    },
  })
}

export function useDeleteGeminiApprovedTrainingsMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => geminiApprovedTrainingService.delete(ids),
    retry: false,
    onSuccess: result => {
      for (const id of result.successIds) {
        queryClient.removeQueries({ queryKey: geminiVisitingTrainingQueryKeys.approvedDetail(id) })
        queryClient.removeQueries({
          queryKey: geminiVisitingTrainingQueryKeys.approvedInstructorApplications(id),
        })
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: geminiVisitingTrainingQueryKeys.approvedList(),
      })
    },
  })
}

export function useRejectGeminiInstructorApplicationMutation(approvedTrainingId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ applicationId, reason }: { applicationId: string; reason?: string }) =>
      rejectGeminiInstructorApplication(applicationId, reason),
    retry: false,
    onSuccess: async () => {
      await invalidateGeminiInstructorApprovalQueries(queryClient, approvedTrainingId)
    },
  })
}

export function useResendGeminiInstructorApplicationNotificationMutation(
  approvedTrainingId: string
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      applicationId,
      payload,
    }: {
      applicationId: string
      payload: Parameters<typeof resendGeminiInstructorApplicationNotification>[1]
    }) => resendGeminiInstructorApplicationNotification(applicationId, payload),
    onSuccess: async () => {
      await invalidateGeminiInstructorApprovalQueries(queryClient, approvedTrainingId)
    },
  })
}
