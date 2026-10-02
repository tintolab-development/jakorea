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
import { getApplicationApiErrorCode } from '../lib/application-api-error'
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
  /** 모집 창과 무관 — formBindingId 가 있으면 발행 양식 GET. */
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
      refetch,
    }
  }

  if (optionsQuery.isPending) {
    return {
      status: 'loading',
      isRemoteEnabled: true,
      bundle: null,
      blockedReason: null,
      refetch,
    }
  }

  if (optionsQuery.isError) {
    return {
      status: 'error',
      isRemoteEnabled: true,
      bundle: null,
      blockedReason: null,
      refetch,
    }
  }

  if (!option || bindingId == null || recruitmentId == null || !applicationType) {
    return {
      status: 'unavailable',
      isRemoteEnabled: true,
      bundle: null,
      blockedReason: option?.blockedReason ?? 'APPLICATION_FORM_NOT_CONFIGURED',
      refetch,
    }
  }

  if (formQuery.isPending) {
    return {
      status: 'loading',
      isRemoteEnabled: true,
      bundle: null,
      blockedReason: option.canApply === false ? (option.blockedReason ?? null) : null,
      refetch,
    }
  }

  if (formQuery.isError || !formQuery.data || !readyBundle) {
    return {
      status: 'error',
      isRemoteEnabled: true,
      bundle: null,
      blockedReason:
        getApplicationApiErrorCode(formQuery.error) ??
        (option.canApply === false ? (option.blockedReason ?? null) : null),
      refetch,
    }
  }

  return {
    status: 'ready',
    isRemoteEnabled: true,
    bundle: readyBundle,
    blockedReason: option.canApply === false ? (option.blockedReason ?? null) : null,
    refetch,
  }
}

export function useSubmitProgramApplication(programId: number | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: PortalSaveApplicationRequest) => {
      if (programId == null) {
        throw new Error('programId is required')
      }
      return submitPortalApplication(programId, body)
    },
    onSuccess: () => {
      if (programId == null) return
      void queryClient.invalidateQueries({
        queryKey: platformQueryKeys.program.applicationOptions(String(programId)),
      })
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
