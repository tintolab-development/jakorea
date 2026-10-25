import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { getAccessToken } from '@/shared/lib/auth-token'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { getQueryRetryHttpStatus, queryRetryDelay, shouldRetryQuery } from '@/shared/lib/query-retry'
import {
  fetchPortalApplicationForm,
  fetchPortalApplicationOptions,
  submitPortalApplication,
} from './application-client'
import type {
  PortalApplicationFormBundle,
  PortalSaveApplicationRequest,
} from './application-types'
import {
  getApplicationApiErrorCode,
  messageForApplicationBlockedReason,
  resolveApplicationBlockedDisplayMessage,
} from '../lib/application-api-error'
import { parsePortalProgramId } from './mappers'
import {
  pickApplicationOption,
  type ProgramApplicationSelection,
} from './pick-application-option'

export type { ProgramApplicationSelection } from './pick-application-option'
export { pickApplicationOption } from './pick-application-option'

const FORM_STALE_MS = 0
const FORM_GC_MS = 15 * 60_000

export type ProgramApplicationFormStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'unavailable'
  | 'error'

export type ProgramApplicationFormQuery = {
  status: ProgramApplicationFormStatus
  isRemoteEnabled: boolean
  bundle: PortalApplicationFormBundle | null
  /** 제출 불가 사유 — options.`canApply=false` 의 blockedReason. GET 양식 성공과 무관. */
  blockedReason: string | null
  /** 화면 배너용 한글 안내 — API `message` 우선, machine code 미노출 */
  blockedMessage: string | null
  refetch: () => void
}

/**
 * 회원 신청 옵션 + 바인딩 양식.
 * Class D. remote + 숫자 programId + access token 일 때만 호출.
 *
 * BE (portal-apply-form-before-recruitment-frontend-handoff-2026-10-02):
 * - form-bindings GET 은 모집 시작 전·종료 후에도 200 + 발행 양식.
 * - options 는 모집 전 `canApply=false` + `RECRUITMENT_NOT_STARTED`,
 *   종료 후 `RECRUITMENT_CLOSED`. formBindingId 는 유지.
 * - 제출/임시저장만 모집 window 로 409 (`RECRUITMENT_NOT_STARTED` / `RECRUITMENT_ENDED`).
 */
export function useProgramApplicationForm(
  programId: string | null | undefined,
  selection?: ProgramApplicationSelection | null,
): ProgramApplicationFormQuery {
  const remote = isRemoteApiConfigured()
  const numericId = parsePortalProgramId(programId)
  const hasToken = Boolean(getAccessToken())
  const enabled = remote && numericId != null && hasToken

  const optionsQuery = useQuery({
    queryKey: platformQueryKeys.program.applicationOptions(String(numericId ?? '')),
    queryFn: ({ signal }) => fetchPortalApplicationOptions(numericId!, signal),
    enabled,
    staleTime: FORM_STALE_MS,
    gcTime: FORM_GC_MS,
    refetchOnMount: query =>
      getQueryRetryHttpStatus(query.state.error) === 404 ? false : 'always',
    refetchOnWindowFocus: query => getQueryRetryHttpStatus(query.state.error) !== 404,
    refetchOnReconnect: query => getQueryRetryHttpStatus(query.state.error) !== 404,
    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
  })

  const option = optionsQuery.data ? pickApplicationOption(optionsQuery.data, selection) : null
  const bindingId = option?.formBindingId ?? null
  const recruitmentId = option?.recruitmentId ?? null
  const applicationType = option?.applicationType?.trim() || null
  /**
   * formBindingId 가 있을 때만 발행 양식 GET.
   * null이면 BE blockedReason(APPLICATION_FORM_NOT_CONFIGURED 등)만 전달하고 GET/POST 하지 않는다.
   */
  const formEnabled =
    enabled &&
    bindingId != null &&
    recruitmentId != null &&
    applicationType != null

  const formQuery = useQuery({
    queryKey: platformQueryKeys.program.applicationForm({
      programId: String(numericId ?? ''),
      bindingId: bindingId ?? 0,
      recruitmentId: recruitmentId ?? 0,
      applicationType: applicationType ?? '',
    }),
    queryFn: ({ signal }) =>
      fetchPortalApplicationForm(
        numericId!,
        bindingId!,
        { recruitmentId: recruitmentId!, applicationType: applicationType! },
        signal,
      ),
    enabled: formEnabled,
    staleTime: FORM_STALE_MS,
    gcTime: FORM_GC_MS,
    refetchOnMount: query => {
      const status = getQueryRetryHttpStatus(query.state.error)
      if (status === 404) return false
      return 'always'
    },
    refetchOnWindowFocus: query => getQueryRetryHttpStatus(query.state.error) !== 404,
    refetchOnReconnect: query => getQueryRetryHttpStatus(query.state.error) !== 404,
    retry: (failureCount, error) => {
      if (getQueryRetryHttpStatus(error) === 404) return false
      return shouldRetryQuery(failureCount, error)
    },
    retryDelay: queryRetryDelay,
  })

  const refetch = () => {
    void optionsQuery.refetch()
    void formQuery.refetch()
  }

  const readyBundle = useMemo((): PortalApplicationFormBundle | null => {
    if (!formQuery.data || !option) return null
    return { option, form: formQuery.data }
  }, [option, formQuery.data])

  if (!enabled) {
    return {
      status: 'idle',
      isRemoteEnabled: false,
      bundle: null,
      blockedReason: null,
      blockedMessage: null,
      refetch,
    }
  }

  if (optionsQuery.isPending) {
    return {
      status: 'loading',
      isRemoteEnabled: true,
      bundle: null,
      blockedReason: null,
      blockedMessage: null,
      refetch,
    }
  }

  if (optionsQuery.isError) {
    const blockedReason = getApplicationApiErrorCode(optionsQuery.error)
    return {
      status: 'error',
      isRemoteEnabled: true,
      bundle: null,
      blockedReason,
      blockedMessage: resolveApplicationBlockedDisplayMessage(
        blockedReason,
        optionsQuery.error,
      ),
      refetch,
    }
  }

  if (!option) {
    const blockedReason =
      selection?.recruitmentId != null || (selection?.recruitmentIds?.length ?? 0) > 0
        ? 'RECRUITMENT_NOT_FOUND'
        : 'APPLICATION_FORM_NOT_CONFIGURED'
    return {
      status: 'unavailable',
      isRemoteEnabled: true,
      bundle: null,
      blockedReason,
      blockedMessage: messageForApplicationBlockedReason(blockedReason),
      refetch,
    }
  }

  if (bindingId == null || recruitmentId == null || !applicationType) {
    const blockedReason = option.blockedReason ?? 'APPLICATION_FORM_NOT_CONFIGURED'
    return {
      status: 'unavailable',
      isRemoteEnabled: true,
      bundle: null,
      blockedReason,
      blockedMessage: messageForApplicationBlockedReason(blockedReason),
      refetch,
    }
  }

  if (formQuery.isPending) {
    const blockedReason = option.canApply === false ? (option.blockedReason ?? null) : null
    return {
      status: 'loading',
      isRemoteEnabled: true,
      bundle: null,
      blockedReason,
      blockedMessage: messageForApplicationBlockedReason(blockedReason),
      refetch,
    }
  }

  if (formQuery.isError || !formQuery.data || !readyBundle) {
    const blockedReason =
      getApplicationApiErrorCode(formQuery.error) ??
      (option.canApply === false ? (option.blockedReason ?? null) : null)
    return {
      status: 'error',
      isRemoteEnabled: true,
      bundle: null,
      blockedReason,
      blockedMessage: resolveApplicationBlockedDisplayMessage(
        blockedReason,
        formQuery.error,
      ),
      refetch,
    }
  }

  const blockedReason = option.canApply === false ? (option.blockedReason ?? null) : null
  return {
    status: 'ready',
    isRemoteEnabled: true,
    bundle: readyBundle,
    blockedReason,
    blockedMessage: messageForApplicationBlockedReason(blockedReason),
    refetch,
  }
}

export type PortalApplicationOptionQuery = {
  isLoading: boolean
  option: ReturnType<typeof pickApplicationOption>
  blockedReason: string | null
  blockedMessage: string | null
}

/** 상세 「신청하기」 비활성·사유. 양식 GET은 하지 않는다. */
export function usePortalApplicationOption(
  programId: string | null | undefined,
  selection?: ProgramApplicationSelection | null,
): PortalApplicationOptionQuery {
  const remote = isRemoteApiConfigured()
  const numericId = parsePortalProgramId(programId)
  const enabled = remote && numericId != null

  const optionsQuery = useQuery({
    queryKey: platformQueryKeys.program.applicationOptions(String(numericId ?? '')),
    queryFn: ({ signal }) => fetchPortalApplicationOptions(numericId!, signal),
    enabled,
    staleTime: FORM_STALE_MS,
    gcTime: FORM_GC_MS,
    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
  })

  if (!enabled || optionsQuery.isPending) {
    return {
      isLoading: Boolean(enabled && optionsQuery.isPending),
      option: null,
      blockedReason: null,
      blockedMessage: null,
    }
  }

  if (optionsQuery.isError) {
    const blockedReason = getApplicationApiErrorCode(optionsQuery.error)
    return {
      isLoading: false,
      option: null,
      blockedReason,
      blockedMessage: resolveApplicationBlockedDisplayMessage(
        blockedReason,
        optionsQuery.error,
      ),
    }
  }

  const option = pickApplicationOption(optionsQuery.data, selection)
  if (!option) {
    const blockedReason =
      selection?.recruitmentId != null || (selection?.recruitmentIds?.length ?? 0) > 0
        ? 'RECRUITMENT_NOT_FOUND'
        : 'APPLICATION_FORM_NOT_CONFIGURED'
    return {
      isLoading: false,
      option: null,
      blockedReason,
      blockedMessage: messageForApplicationBlockedReason(blockedReason),
    }
  }

  const blockedReason =
    option.formBindingId == null
      ? (option.blockedReason ?? 'APPLICATION_FORM_NOT_CONFIGURED')
      : option.canApply === false
        ? (option.blockedReason ?? 'PROGRAM_NOT_APPLICABLE')
        : null

  return {
    isLoading: false,
    option,
    blockedReason,
    blockedMessage: messageForApplicationBlockedReason(blockedReason),
  }
}

export function useSubmitProgramApplication(programId: number | null) {
  const queryClient = useQueryClient()
  return useMutation({
    retry: false,
    mutationFn: (body: PortalSaveApplicationRequest) => {
      if (programId == null) {
        throw new Error('programId is required')
      }
      return submitPortalApplication(programId, body)
    },
    onSuccess: async (response, variables) => {
      if (programId == null) return
      const applicationId = response.applicationId
      const applicationType = variables.applicationType
      const applicationIdKey = applicationId == null ? null : String(applicationId)
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: platformQueryKeys.program.applicationOptions(String(programId)),
        }),
        queryClient.invalidateQueries({
          queryKey: platformQueryKeys.program.applicationForm({
            programId: String(programId),
            bindingId: variables.formBindingId,
            recruitmentId: variables.recruitmentId,
            applicationType,
          }),
        }),
        queryClient.invalidateQueries({
          queryKey: platformQueryKeys.mypage.programApplications.listPrefix(),
        }),
        ...(applicationIdKey
          ? [
              queryClient.invalidateQueries({
                queryKey: platformQueryKeys.mypage.programApplications.detail(
                  applicationType,
                  applicationIdKey,
                ),
              }),
              queryClient.invalidateQueries({
                queryKey: platformQueryKeys.mypage.programApplications.schedules(
                  applicationType,
                  applicationIdKey,
                ),
              }),
              queryClient.invalidateQueries({
                queryKey: platformQueryKeys.mypage.programApplications.assignments(
                  applicationType,
                  applicationIdKey,
                ),
              }),
            ]
          : []),
      ])
    },
    onError: error => {
      if (programId == null) return
      if (getApplicationApiErrorCode(error) !== 'RECRUITMENT_FORM_BINDING_MISMATCH') return
      void queryClient.invalidateQueries({
        queryKey: platformQueryKeys.program.applicationOptions(String(programId)),
      })
    },
  })
}
