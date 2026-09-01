import { useQuery } from '@tanstack/react-query'
import { getInquiryList } from '@/features/posts/api/inquiries/admin-inquiries-service'
import { postsQueryKeys } from '@/features/posts/api/posts-query-keys'
import { usePostsRemoteEnabled } from '@/features/posts/hooks/use-posts-remote-enabled'

export function useInquiryListQuery(searchParams: URLSearchParams, enabled = true) {
  const searchParamsKey = searchParams.toString()
  const remoteEnabled = usePostsRemoteEnabled('inquiries', enabled)

  return useQuery({
    queryKey: postsQueryKeys.inquiries.list(searchParamsKey),
    queryFn: () => getInquiryList(new URLSearchParams(searchParamsKey)),
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
  })
}
