import { useMutation } from '@tanstack/react-query'
import { postPortalPasswordChange } from '../api/client'
import type { PasswordChangeRequest } from '../api/types'

/** Class G — 로그인 세션 비밀번호 변경. */
export function usePortalPasswordChangeMutation() {
  return useMutation({
    mutationFn: (body: PasswordChangeRequest) => postPortalPasswordChange(body),
    retry: false,
  })
}
