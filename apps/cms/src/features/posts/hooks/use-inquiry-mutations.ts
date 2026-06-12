import { useMutation, useQueryClient } from '@tanstack/react-query'
import { submitInquiryReply } from '@/features/posts/api/inquiries/admin-inquiries-service'
import { postsQueryKeys } from '@/features/posts/api/posts-query-keys'

export function useInquiryMutations() {
  const queryClient = useQueryClient()

  const invalidateInquiries = (inquiryId?: string) => {
    void queryClient.invalidateQueries({ queryKey: postsQueryKeys.inquiries.all() })
    if (inquiryId) {
      void queryClient.invalidateQueries({
        queryKey: postsQueryKeys.inquiries.detail(inquiryId),
      })
      void queryClient.invalidateQueries({
        queryKey: postsQueryKeys.inquiries.answers(inquiryId),
      })
    }
  }

  const replyMutation = useMutation({
    mutationFn: ({ inquiryId, content }: { inquiryId: string; content: string }) =>
      submitInquiryReply(inquiryId, content),
    onSuccess: (_data, variables) => {
      invalidateInquiries(variables.inquiryId)
    },
  })

  return { replyMutation }
}
