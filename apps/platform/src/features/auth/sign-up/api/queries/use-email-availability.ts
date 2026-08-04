import { useMutation } from '@tanstack/react-query'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { getEmailAvailability } from '../client'

export function useEmailAvailabilityMutation() {
  return useMutation({
    mutationKey: platformQueryKeys.auth.emailAvailability(''),
    mutationFn: (email: string) => getEmailAvailability(email),
  })
}
