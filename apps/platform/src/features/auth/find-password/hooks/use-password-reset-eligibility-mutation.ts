import { useMutation } from '@tanstack/react-query'
import { postPortalPasswordResetEligibility } from '../api/client'
import type { PasswordResetEligibilityRequest } from '../api/types'

/** Class G — 본인인증 직후 입력 이메일과 인증 정보가 같은 회원 계정인지 확인한다. */
export function usePortalPasswordResetEligibilityMutation() {
  return useMutation({
    mutationFn: (body: PasswordResetEligibilityRequest) => postPortalPasswordResetEligibility(body),
    retry: false,
  })
}
