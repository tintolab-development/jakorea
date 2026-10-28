import { useMutation, useQueryClient } from '@tanstack/react-query'
import { patchPortalProfile } from '@/features/auth/sign-in'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { postInstructorRoleRequest } from './client'
import type { InstructorEmploymentStatusToSync } from './resolve-employment-status-sync'
import type { InstructorRoleRequestCreateRequest } from './types'

export type CreateInstructorRoleRequestMutationInput = {
  body: InstructorRoleRequestCreateRequest
  employmentStatusToSync?: InstructorEmploymentStatusToSync
}

/**
 * Class G — 강사 권한 신청 제출.
 * 신청 저장이 성공한 뒤 재직 현황이 변경된 경우 회원 프로필도 갱신한다.
 * 두 요청은 순차 처리하여 신청 성공 전에 회원 프로필만 변경되지 않도록 한다.
 */
export function useCreateInstructorRoleRequestMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      body,
      employmentStatusToSync,
    }: CreateInstructorRoleRequestMutationInput) => {
      const response = await postInstructorRoleRequest(body)

      if (employmentStatusToSync) {
        const updatedProfile = await patchPortalProfile({
          teacherEmploymentStatus: employmentStatusToSync,
        })
        queryClient.setQueryData(platformQueryKeys.auth.memberProfile(), updatedProfile)
      }

      return response
    },
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: platformQueryKeys.mypage.instructorRoleRequestCurrent(),
      })
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.auth.memberProfile() })
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.auth.me() })
    },
  })
}
