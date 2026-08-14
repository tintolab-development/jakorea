import { useMutation } from '@tanstack/react-query'
import { patchAdminProvisionedProfile } from '../api/client'
import type { AdminProvisionedProfileRequest } from '../api/types'

/** Class G — 관리자 등록 회원 생년월일·성별 프로필 확인 (본인인증 전 필수). */
export function useAdminProvisionedProfileMutation() {
  return useMutation({
    mutationFn: (body: AdminProvisionedProfileRequest) => patchAdminProvisionedProfile(body),
    retry: false,
  })
}
