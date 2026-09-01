import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createFaq,
  deleteFaq,
  deleteFaqs,
  updateFaq,
} from '@/features/posts/api/faqs/admin-faqs-service'
import type { FaqUpdatePayload } from '@/features/posts/api/faqs/adapters/faq-adapters'
import { postsQueryKeys } from '@/features/posts/api/posts-query-keys'
import { discardDeletedDetailQuery } from '@/features/posts/lib/leave-deleted-detail'
import {
  applyCreatedFaqToLists,
  applyDeletedFaqToLists,
  applyUpdatedFaqToLists,
  invalidateFaqLists,
} from '@/features/posts/lib/faq-query-cache'

export function useFaqMutations() {
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: createFaq,
    onSuccess: async created => {
      if (!created.id) {
        await invalidateFaqLists(queryClient)
        return
      }
      queryClient.setQueryData(postsQueryKeys.faqs.detail(created.id), created)
      applyCreatedFaqToLists(queryClient, created)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: FaqUpdatePayload }) => updateFaq(id, patch),
    onSuccess: async (updated, variables) => {
      if (!updated.id) {
        await invalidateFaqLists(queryClient)
        return
      }
      queryClient.setQueryData(postsQueryKeys.faqs.detail(variables.id), updated)
      applyUpdatedFaqToLists(queryClient, updated)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteFaq,
    onSuccess: (_data, id) => {
      discardDeletedDetailQuery(queryClient, postsQueryKeys.faqs.detail(id))
      applyDeletedFaqToLists(queryClient, id)
    },
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: deleteFaqs,
    onSuccess: (_data, ids) => {
      for (const id of ids) {
        discardDeletedDetailQuery(queryClient, postsQueryKeys.faqs.detail(id))
        applyDeletedFaqToLists(queryClient, id)
      }
    },
  })

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    bulkDeleteMutation,
  }
}
