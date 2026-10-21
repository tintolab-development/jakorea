import { useMutation, useQueryClient } from '@tanstack/react-query'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { subscribeNewsletter } from './newsletter-client'

export function useNewsletterSubscribeMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: subscribeNewsletter,
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.newsletter.me() })
    },
  })
}
