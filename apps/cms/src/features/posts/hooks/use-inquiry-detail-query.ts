import { useQuery } from '@tanstack/react-query'
import { getInquiryDetail } from '@/features/posts/api/inquiries/admin-inquiries-service'
import { postsQueryKeys } from '@/features/posts/api/posts-query-keys'
import { usePostsRemoteEnabled } from '@/features/posts/hooks/use-posts-remote-enabled'

export function useInquiryDetailQuery(inquiryId: string | null, enabled = true) {
  const remoteEnabled = usePostsRemoteEnabled('inquiries', enabled && Boolean(inquiryId))

  return useQuery({
    queryKey: postsQueryKeys.inquiries.detail(inquiryId ?? ''),
    queryFn: () => getInquiryDetail(inquiryId!),
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
  })
}
