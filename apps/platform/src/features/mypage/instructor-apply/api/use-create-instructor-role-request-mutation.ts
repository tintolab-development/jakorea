import { useMutation, useQueryClient } from '@tanstack/react-query'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { postInstructorRoleRequest } from './client'
import type { InstructorRoleRequestCreateRequest } from './types'

/** Class G — 강사 권한 신청 제출. 성공 시 current·프로필 캐시 무효화. */
export function useCreateInstructorRoleRequestMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: InstructorRoleRequestCreateRequest) => postInstructorRoleRequest(body),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: platformQueryKeys.mypage.instructorRoleRequestCurrent(),
        }),
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.auth.memberProfile() }),
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.auth.me() }),
      ])
    },
  })
}
