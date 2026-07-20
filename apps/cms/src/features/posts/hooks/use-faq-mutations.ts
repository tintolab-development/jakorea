import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createFaq,
  deleteFaq,
  deleteFaqs,
  updateFaq,
} from '@/features/posts/api/faqs/admin-faqs-service'
import type { FaqUpdatePayload } from '@/features/posts/api/faqs/adapters/faq-adapters'
import { postsQueryKeys } from '@/features/posts/api/posts-query-keys'

export function useFaqMutations() {
  const queryClient = useQueryClient()

  const invalidateFaqs = () => {
    void queryClient.invalidateQueries({ queryKey: postsQueryKeys.faqs.all() })
  }

  const createMutation = useMutation({
    mutationFn: createFaq,
    onSuccess: invalidateFaqs,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: FaqUpdatePayload }) => updateFaq(id, patch),
    onSuccess: (_data, variables) => {
      invalidateFaqs()
      void queryClient.invalidateQueries({
        queryKey: postsQueryKeys.faqs.detail(variables.id),
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteFaq,
    onSuccess: invalidateFaqs,
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: deleteFaqs,
    onSuccess: invalidateFaqs,
  })

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    bulkDeleteMutation,
  }
}
