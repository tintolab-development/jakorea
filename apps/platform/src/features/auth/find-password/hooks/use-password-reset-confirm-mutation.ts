import { useMutation } from '@tanstack/react-query'
import { postPortalPasswordResetConfirm } from '../api/client'
import type { PasswordResetConfirmRequest } from '../api/types'

/** Class G — 본인인증 세션으로 비밀번호 재설정. */
export function usePortalPasswordResetConfirmMutation() {
  return useMutation({
    mutationFn: async (body: PasswordResetConfirmRequest) => {
      const result = await postPortalPasswordResetConfirm(body)
      if (result.resetCompleted === false) {
        throw new Error('비밀번호 변경에 실패했습니다.')
      }
      return result
    },
    retry: false,
  })
}
