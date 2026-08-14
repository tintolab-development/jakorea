import { useMutation } from '@tanstack/react-query'
import { postAdminProvisionedIdentityConfirm } from '../api/client'
import type { AdminProvisionedIdentityConfirmRequest } from '../api/types'

/** Class G — 관리자 등록 회원 NICE 본인인증 결과를 계정에 연결. */
export function useAdminProvisionedIdentityConfirmMutation() {
  return useMutation({
    mutationFn: (body: AdminProvisionedIdentityConfirmRequest) =>
      postAdminProvisionedIdentityConfirm(body),
    retry: false,
  })
}
