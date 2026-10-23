import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { getAccessToken } from '@/shared/lib/auth-token'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { queryRetryDelay, shouldRetryQuery } from '@/shared/lib/query-retry'
import type { ProgramApplicationType } from '@/features/mypage/education/applications/api/types'
import {
  fetchUjatEducationDocuments,
  fetchUjatEducationDocumentsForSchedule,
  fetchUjatEducationFormBindingRender,
  fetchUjatEducationFormResponse,
  reviseUjatEducationDocument,
  submitUjatEducationDocument,
  type UjatEducationDocumentRevisionBody,
  type UjatEducationDocumentSubmitBody,
} from './education-documents-client'

const STALE_MS = 30_000
const GC_MS = 10 * 60_000

function isVolunteerScope(
  applicationType: ProgramApplicationType | null | undefined,
  applicationId: string | null | undefined,
): applicationType is ProgramApplicationType {
  return (
    isRemoteApiConfigured() &&
    Boolean(getAccessToken()) &&
    applicationType === 'VOLUNTEER' &&
    Boolean(applicationId)
  )
}

function queryOptions() {
  return {
    staleTime: STALE_MS,
    gcTime: GC_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
  } as const
}

export function useUjatEducationDocumentsQuery(
  applicationType: ProgramApplicationType | null | undefined,
  applicationId: string | null | undefined,
) {
  const enabled = isVolunteerScope(applicationType, applicationId)
  const query = useQuery({
    queryKey: platformQueryKeys.mypage.programApplications.educationDocuments(
      applicationType ?? '',
      applicationId ?? '',
    ),
    queryFn: ({ signal }) =>
      fetchUjatEducationDocuments(applicationType!, applicationId!, signal),
    enabled,
    ...queryOptions(),
  })
  return {
    enabled,
    isLoading: enabled && query.isPending,
    isError: enabled && query.isError,
    error: enabled ? query.error : null,
    data: query.data ?? null,
    refetch: query.refetch,
    isRefetching: query.isRefetching,
  }
}

export function useUjatEducationDocumentsForScheduleQuery(
  applicationType: ProgramApplicationType | null | undefined,
  applicationId: string | null | undefined,
  scheduleId: number | null,
  options?: { enabled?: boolean },
) {
  const enabled =
    isVolunteerScope(applicationType, applicationId) &&
    scheduleId != null &&
    scheduleId > 0 &&
    (options?.enabled ?? true)
  const query = useQuery({
    queryKey: platformQueryKeys.mypage.programApplications.educationDocumentsForSchedule(
      applicationType ?? '',
      applicationId ?? '',
      scheduleId ?? 0,
    ),
    queryFn: ({ signal }) =>
      fetchUjatEducationDocumentsForSchedule(
        applicationType!,
        applicationId!,
        scheduleId!,
        signal,
      ),
    enabled,
    ...queryOptions(),
  })
  return {
    enabled,
    isLoading: enabled && query.isPending,
    isError: enabled && query.isError,
    error: enabled ? query.error : null,
    data: query.data ?? null,
    refetch: query.refetch,
  }
}

export function useUjatEducationFormBindingQuery(
  programId: number | null,
  bindingId: number | null,
  options?: { enabled?: boolean },
) {
  const enabled =
    isRemoteApiConfigured() &&
    Boolean(getAccessToken()) &&
    programId != null &&
    programId > 0 &&
    bindingId != null &&
    bindingId > 0 &&
    (options?.enabled ?? true)
  const query = useQuery({
    queryKey: platformQueryKeys.mypage.programApplications.formBinding({
      programId: String(programId ?? ''),
      bindingId: bindingId ?? 0,
    }),
    queryFn: ({ signal }) =>
      fetchUjatEducationFormBindingRender(programId!, bindingId!, signal),
    enabled,
    staleTime: 60_000,
    gcTime: GC_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
  })
  return {
    enabled,
    isLoading: enabled && query.isPending,
    isError: enabled && query.isError,
    error: enabled ? query.error : null,
    document: query.data ?? null,
  }
}

export function useUjatEducationFormResponseQuery(
  formResponseId: number | null,
  options?: { enabled?: boolean },
) {
  const enabled =
    isRemoteApiConfigured() &&
    Boolean(getAccessToken()) &&
    formResponseId != null &&
    formResponseId > 0 &&
    (options?.enabled ?? true)
  const query = useQuery({
    queryKey: platformQueryKeys.mypage.formResponseDetail(formResponseId ?? 0),
    queryFn: ({ signal }) => fetchUjatEducationFormResponse(formResponseId!, signal),
    enabled,
    staleTime: 60_000,
    gcTime: GC_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
  })
  return {
    enabled,
    isLoading: enabled && query.isPending,
    isError: enabled && query.isError,
    error: enabled ? query.error : null,
    detail: query.data ?? null,
  }
}

function invalidateDocumentQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  applicationType: ProgramApplicationType,
  applicationId: string,
  scheduleId: number,
  formResponseId?: number | null,
) {
  void queryClient.invalidateQueries({
    queryKey: platformQueryKeys.mypage.programApplications.educationDocuments(
      applicationType,
      applicationId,
    ),
    exact: true,
  })
  void queryClient.invalidateQueries({
    queryKey: platformQueryKeys.mypage.programApplications.educationDocumentsForSchedule(
      applicationType,
      applicationId,
      scheduleId,
    ),
    exact: true,
  })
  if (formResponseId != null && formResponseId > 0) {
    void queryClient.invalidateQueries({
      queryKey: platformQueryKeys.mypage.formResponseDetail(formResponseId),
      exact: true,
    })
    void queryClient.invalidateQueries({
      queryKey: platformQueryKeys.mypage.formResponseFeedback(formResponseId),
      exact: true,
    })
  }
}

export function useSubmitUjatEducationDocumentMutation(
  applicationType: ProgramApplicationType | null | undefined,
  applicationId: string | null | undefined,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      programId: number
      bindingId: number
      scheduleId: number
      body: UjatEducationDocumentSubmitBody
    }) => submitUjatEducationDocument(input.programId, input.bindingId, input.body),
    onSuccess: (_data, input) => {
      if (!applicationType || !applicationId) return
      invalidateDocumentQueries(
        queryClient,
        applicationType,
        applicationId,
        input.scheduleId,
      )
    },
  })
}

export function useReviseUjatEducationDocumentMutation(
  applicationType: ProgramApplicationType | null | undefined,
  applicationId: string | null | undefined,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      formResponseId: number
      scheduleId: number
      body: UjatEducationDocumentRevisionBody
    }) => reviseUjatEducationDocument(input.formResponseId, input.body),
    onSuccess: (_data, input) => {
      if (!applicationType || !applicationId) return
      invalidateDocumentQueries(
        queryClient,
        applicationType,
        applicationId,
        input.scheduleId,
        input.formResponseId,
      )
    },
  })
}
