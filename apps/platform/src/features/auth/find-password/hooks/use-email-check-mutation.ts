import { useMutation } from '@tanstack/react-query'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { postPortalEmailCheck } from '../api/client'
import type { AccountEmailCheckPurpose } from '../api/types'

/** Class G — 비밀번호 찾기 전 이메일 존재 확인. */
export function usePortalEmailCheckMutation() {
  return useMutation({
    mutationKey: platformQueryKeys.auth.emailCheck('PASSWORD_RESET'),
    mutationFn: (input: { email: string; purpose: AccountEmailCheckPurpose }) =>
      postPortalEmailCheck({
        email: input.email,
        purpose: input.purpose,
      }),
    retry: false,
  })
}
