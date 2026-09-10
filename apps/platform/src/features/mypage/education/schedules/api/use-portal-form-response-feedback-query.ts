import { useQuery } from '@tanstack/react-query'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { getAccessToken } from '@/shared/lib/auth-token'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { getPortalFormResponseFeedback } from './form-response-feedback-client'

/**
 * Class D — 폼 응답 피드백 상세.
 * `enabled`는 모달 open + formResponseId 있을 때만 true (목록 렌더 시 과호출 방지).
 */
export function usePortalFormResponseFeedbackQuery(options: {
  formResponseId?: number | null
  enabled?: boolean
}) {
  const formResponseId = options.formResponseId
  const remote = isRemoteApiConfigured()
  const hasToken = Boolean(getAccessToken())
  const hasId =
    formResponseId != null && typeof formResponseId === 'number' && Number.isFinite(formResponseId)
  const enabled =
    (options.enabled ?? false) && remote && hasToken && hasId

  return useQuery({
    queryKey: platformQueryKeys.mypage.formResponseFeedback(formResponseId ?? 0),
    queryFn: ({ signal }) => getPortalFormResponseFeedback(formResponseId!, signal),
    enabled,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  })
}
