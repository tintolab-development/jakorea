import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createFormResponseFeedbackRemote } from '@/features/template/api/form-templates-api-client'
import { formResponseQueryKeys } from '@/features/template/api/form-response-query-keys'
import { isFormResponseFeedbackStatusConflict } from '@/features/template/lib/form-response-feedback-error'
import type { FormResponseFeedbackCreateRequest } from '@/shared/api/generated/forms-surveys/schemas'

type CreateFormResponseFeedbackVariables = {
  responseId: number
  body: FormResponseFeedbackCreateRequest
}

/**
 * POST /api/admin/form-responses/{responseId}/feedback
 * — 성공 시 해당 response feedback detail만 seed. 광범위 invalidate 없음.
 * — 409(STATUS_INVALID): 상태가 바뀐 것이므로 제출 목록 refetch → CTA 재계산.
 */
export function useCreateFormResponseFeedbackMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ responseId, body }: CreateFormResponseFeedbackVariables) =>
      createFormResponseFeedbackRemote(responseId, body),
    retry: false,
    onSuccess: (created, { responseId }) => {
      queryClient.setQueryData(formResponseQueryKeys.feedback(responseId), created)
      // 회원 과제 제출 목록(responseStatus 등) — 모달 열림 시에만 캐시된 좁은 키
      void queryClient.invalidateQueries({
        queryKey: ['member-detail-assignment-submissions'],
        exact: false,
      })
    },
    onError: error => {
      if (!isFormResponseFeedbackStatusConflict(error)) return
      void queryClient.invalidateQueries({
        queryKey: ['member-detail-assignment-submissions'],
        exact: false,
      })
    },
  })
}
