import { getFaqListPage } from '@/features/posts/api/faqs/admin-faqs-service'
import { postsQueryKeys } from '@/features/posts/api/posts-query-keys'
import { usePostsRemoteEnabled } from '@/features/posts/hooks/use-posts-remote-enabled'
import { useInfiniteLogList } from '@/features/logs/hooks/use-infinite-log-list'

export function useFaqListQuery(searchParams: URLSearchParams, enabled = true) {
  const searchParamsKey = searchParams.toString()
  const remoteEnabled = usePostsRemoteEnabled('faqs', enabled)

  return useInfiniteLogList({
    queryKey: postsQueryKeys.faqs.list(searchParamsKey),
    queryKeyIdentity: searchParamsKey,
    queryFn: page => getFaqListPage(new URLSearchParams(searchParamsKey), page),
    enabled: remoteEnabled,
  })
}
