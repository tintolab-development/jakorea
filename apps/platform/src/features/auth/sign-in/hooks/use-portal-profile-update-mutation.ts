import { useMutation, useQueryClient } from '@tanstack/react-query'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { patchPortalProfile } from '../api/client'
import type { UpdatePortalProfileRequest } from '../api/types'

/** Class G — 내정보 수정. 성공 시 memberProfile 캐시를 응답으로 교체. */
export function usePortalProfileUpdateMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: UpdatePortalProfileRequest) => patchPortalProfile(body),
    retry: false,
    onSuccess: updated => {
      queryClient.setQueryData(platformQueryKeys.auth.memberProfile(), updated)
    },
  })
}
