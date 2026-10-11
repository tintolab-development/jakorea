import { getInquiryListPage } from '@/features/posts/api/inquiries/admin-inquiries-service'
import { postsQueryKeys } from '@/features/posts/api/posts-query-keys'
import { usePostsRemoteEnabled } from '@/features/posts/hooks/use-posts-remote-enabled'
import { useInfiniteLogList } from '@/features/logs/hooks/use-infinite-log-list'

export function useInquiryListQuery(searchParams: URLSearchParams, enabled = true) {
  const searchParamsKey = searchParams.toString()
  const remoteEnabled = usePostsRemoteEnabled('inquiries', enabled)

  return useInfiniteLogList({
    queryKey: postsQueryKeys.inquiries.list(searchParamsKey),
    queryKeyIdentity: searchParamsKey,
    queryFn: page =>
      getInquiryListPage(new URLSearchParams(searchParamsKey), page),
    enabled: remoteEnabled,
  })
}
