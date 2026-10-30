import { useMutation, useQueryClient } from '@tanstack/react-query'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { postAgeTransitionComplete } from '../api/client'
import type { AgeTransitionCompleteRequest } from '../api/types'

type CompleteVariables = AgeTransitionCompleteRequest & {
  idempotencyKey?: string
}

export function useAgeTransitionCompleteMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ idempotencyKey, ...body }: CompleteVariables) =>
      postAgeTransitionComplete(body, idempotencyKey),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.auth.me() })
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.auth.memberProfile() })
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.auth.ageTransition() })
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.mypage.consents() })
    },
  })
}
