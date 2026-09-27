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
  PortalApplicationOption,
  PortalSaveApplicationRequest,
} from './application-types'
import { getApplicationApiErrorCode } from '../lib/application-api-error'
import { parsePortalProgramId } from './mappers'

const FORM_STALE_MS = 0
const FORM_GC_MS = 15 * 60_000

/** 모집 기간 밖이면 form-bindings 가 409 — 양식 GET 을 건너뛴다. */
function isRecruitmentWindowBlocked(reason: string | null | undefined): boolean {
  const code = (reason ?? '').trim().toUpperCase()
  return code === 'RECRUITMENT_NOT_STARTED' || code === 'RECRUITMENT_CLOSED'
}

function pickApplicationOption(
  options: PortalApplicationOption[],
): PortalApplicationOption | null {
  const withBinding = options.filter(
    row =>
      row.formBindingId != null &&
      row.recruitmentId != null &&
      Boolean(row.applicationType?.trim()),
  )
  if (withBinding.length === 0) return null
  const canApply = withBinding.find(row => row.canApply === true)
  return canApply ?? withBinding[0] ?? null
}

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
  blockedReason: string | null
  refetch: () => void
}

/**
 * 회원 신청 옵션 + 바인딩 양식.
 * Class D. remote + 숫자 programId + access token 일 때만 호출.
 *
 * BE: 모집 전이면 options 에 formBindingId 는 있고 canApply=false + RECRUITMENT_NOT_STARTED.
 * 그 상태에서 form-bindings 는 409 이므로 GET 하지 않는다.
 */
export function useProgramApplicationForm(
  programId: string | null | undefined,
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
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
  })

  const option = optionsQuery.data ? pickApplicationOption(optionsQuery.data) : null
  const bindingId = option?.formBindingId ?? null
  const recruitmentId = option?.recruitmentId ?? null
  const applicationType = option?.applicationType?.trim() || null
  /** 모집 창 밖이면 form-bindings 409 — GET 생략. 회원 자격 부족은 양식 미리보기 가능. */
  const recruitmentBlocked = isRecruitmentWindowBlocked(option?.blockedReason)

  const formEnabled =
    enabled &&
    bindingId != null &&
    recruitmentId != null &&
    applicationType != null &&
    !recruitmentBlocked

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
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: (failureCount, error) => {
      const status = getQueryRetryHttpStatus(error)
      if (status === 404 || status === 409) return false
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

  if (recruitmentBlocked) {
    return {
      status: 'unavailable',
      isRemoteEnabled: true,
      bundle: null,
      blockedReason: option.blockedReason ?? 'RECRUITMENT_NOT_STARTED',
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
    const code = getApplicationApiErrorCode(formQuery.error)
    return {
      status: code && isRecruitmentWindowBlocked(code) ? 'unavailable' : 'error',
      isRemoteEnabled: true,
      bundle: null,
      blockedReason: code ?? option.blockedReason ?? null,
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
  })
}
