import { useMutation, useQueryClient } from '@tanstack/react-query'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { postAgeTransitionChoice } from '../api/client'
import type { AgeTransitionChoice } from '../api/types'

export function useAgeTransitionChoiceMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (choice: AgeTransitionChoice) => postAgeTransitionChoice(choice),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.auth.ageTransition() })
    },
  })
}
