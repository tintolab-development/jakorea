import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { getAccessToken } from '@/shared/lib/auth-token'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { queryRetryDelay, shouldRetryQuery } from '@/shared/lib/query-retry'
import type { ProgramApplicationType } from '../../applications/api/types'
import {
  fetchPortalAssignmentFormBinding,
  fetchPortalAssignmentFormResponse,
  revisePortalAssignmentResponse,
  submitPortalAssignmentResponse,
  type PortalAssignmentRevisionBody,
  type PortalAssignmentSubmitBody,
} from './assignment-client'

const STALE_MS = 60_000
const GC_MS = 10 * 60_000

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

function canUsePortalAssignmentForm(
  programId: number | null,
  bindingId: number | null,
): boolean {
  return Boolean(
    isRemoteApiConfigured() &&
      getAccessToken() &&
      programId != null &&
      programId > 0 &&
      bindingId != null &&
      bindingId > 0,
  )
}

export function usePortalAssignmentFormBindingQuery(
  programId: number | null,
  bindingId: number | null,
  options?: { enabled?: boolean },
) {
  const enabled =
    canUsePortalAssignmentForm(programId, bindingId) && (options?.enabled ?? true)
  const query = useQuery({
    queryKey: platformQueryKeys.mypage.programApplications.formBinding({
      programId: String(programId ?? ''),
      bindingId: bindingId ?? 0,
    }),
    queryFn: ({ signal }) => fetchPortalAssignmentFormBinding(programId!, bindingId!, signal),
    enabled,
    ...queryOptions(),
  })
  return {
    enabled,
    isLoading: enabled && query.isPending,
    isError: enabled && query.isError,
    error: enabled ? query.error : null,
    document: query.data ?? null,
  }
}

export function usePortalAssignmentFormResponseQuery(
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
    queryFn: ({ signal }) => fetchPortalAssignmentFormResponse(formResponseId!, signal),
    enabled,
    ...queryOptions(),
  })
  return {
    enabled,
    isLoading: enabled && query.isPending,
    isError: enabled && query.isError,
    error: enabled ? query.error : null,
    detail: query.data ?? null,
  }
}

function invalidateAssignmentQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  applicationType: ProgramApplicationType | null | undefined,
  applicationId: string | null | undefined,
  formResponseId?: number | null,
) {
  if (applicationType && applicationId) {
    void queryClient.invalidateQueries({
      queryKey: platformQueryKeys.mypage.programApplications.forms(
        applicationType,
        applicationId,
        'ASSIGNMENT',
      ),
      exact: true,
    })
    void queryClient.invalidateQueries({
      queryKey: platformQueryKeys.mypage.programApplications.forms(
        applicationType,
        applicationId,
        'HOMEWORK',
      ),
      exact: true,
    })
    void queryClient.invalidateQueries({
      queryKey: platformQueryKeys.mypage.programApplications.schedules(
        applicationType,
        applicationId,
      ),
      exact: true,
    })
  }
  if (formResponseId != null && formResponseId > 0) {
    void queryClient.invalidateQueries({
      queryKey: platformQueryKeys.mypage.formResponseDetail(formResponseId),
      exact: true,
    })
  }
}

export function useSubmitPortalAssignmentMutation(
  applicationType: ProgramApplicationType | null | undefined,
  applicationId: string | null | undefined,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      programId: number
      bindingId: number
      body: PortalAssignmentSubmitBody
    }) => submitPortalAssignmentResponse(input.programId, input.bindingId, input.body),
    onSuccess: () => {
      invalidateAssignmentQueries(queryClient, applicationType, applicationId)
    },
  })
}

export function useRevisePortalAssignmentMutation(
  applicationType: ProgramApplicationType | null | undefined,
  applicationId: string | null | undefined,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { formResponseId: number; body: PortalAssignmentRevisionBody }) =>
      revisePortalAssignmentResponse(input.formResponseId, input.body),
    onSuccess: (_data, input) => {
      invalidateAssignmentQueries(queryClient, applicationType, applicationId, input.formResponseId)
    },
  })
}
