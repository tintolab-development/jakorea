import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  deleteInquiry,
  deleteInquiries,
  submitInquiryReply,
} from '@/features/posts/api/inquiries/admin-inquiries-service'
import { postsQueryKeys } from '@/features/posts/api/posts-query-keys'
import {
  applyDeletedInquiryToLists,
  invalidateInquiryLists,
  removeInquiryDetailQueries,
} from '@/features/posts/lib/inquiry-query-cache'

export function useInquiryMutations() {
  const queryClient = useQueryClient()

  const replyMutation = useMutation({
    mutationFn: ({ inquiryId, content }: { inquiryId: string; content: string }) =>
      submitInquiryReply(inquiryId, content),
    onSuccess: async (_data, { inquiryId }) => {
      await invalidateInquiryLists(queryClient)
      await queryClient.invalidateQueries({
        queryKey: postsQueryKeys.inquiries.detail(inquiryId),
      })
      await queryClient.invalidateQueries({
        queryKey: postsQueryKeys.inquiries.answers(inquiryId),
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteInquiry,
    onSuccess: (_data, id) => {
      removeInquiryDetailQueries(queryClient, id)
      applyDeletedInquiryToLists(queryClient, id)
    },
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: deleteInquiries,
    onSuccess: (_data, ids) => {
      for (const id of ids) {
        removeInquiryDetailQueries(queryClient, id)
        applyDeletedInquiryToLists(queryClient, id)
      }
    },
  })

  return { replyMutation, deleteMutation, bulkDeleteMutation }
}
