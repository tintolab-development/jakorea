import { useMutation } from '@tanstack/react-query'
import { fetchConsentFilledDocumentRemote } from '@/features/user/api/members-api-client'
import type { FilledDocumentResponse } from '@/shared/api/generated/members/schemas/filledDocumentResponse'

export type ConsentFilledDocumentMutationInput = {
  memberId: number
  consentType: string
  reason: string
}

/**
 * 회원 동의서 작성본 원문 조회 — Class G (민감 원문, 캐시 금지).
 * 모달 로컬 state로만 들고, 닫으면 `reset()`으로 폐기한다.
 */
export function useConsentFilledDocumentMutation() {
  return useMutation({
    mutationFn: async (
      input: ConsentFilledDocumentMutationInput
    ): Promise<FilledDocumentResponse> => {
      const reason = input.reason.trim()
      if (reason.length < 1 || reason.length > 500) {
        throw new Error('개인정보 열람 사유를 1자 이상 500자 이하로 입력해 주세요.')
      }
      return fetchConsentFilledDocumentRemote(input.memberId, input.consentType, { reason })
    },
    retry: false,
    gcTime: 0,
  })
}
