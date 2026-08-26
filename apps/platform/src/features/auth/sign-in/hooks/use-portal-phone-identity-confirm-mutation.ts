import { useMutation, useQueryClient } from '@tanstack/react-query'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { postPortalPhoneIdentityConfirm } from '../api/client'
import type { PhoneIdentityConfirmRequest, PortalProfileResponse } from '../api/types'

/** Class G — 연락처 본인인증 후 변경. 상세 캐시 전화번호 반영 뒤 memberProfile 재조회. */
export function usePortalPhoneIdentityConfirmMutation() {
  const queryClient = useQueryClient()
  const profileKey = platformQueryKeys.auth.memberProfile()

  return useMutation({
    mutationFn: (body: PhoneIdentityConfirmRequest) => postPortalPhoneIdentityConfirm(body),
    retry: false,
    onSuccess: result => {
      if (result.phone?.trim()) {
        queryClient.setQueryData<PortalProfileResponse>(profileKey, previous =>
          previous ? { ...previous, phone: result.phone } : previous,
        )
      }

      void queryClient.invalidateQueries({ queryKey: profileKey })
    },
  })
}
