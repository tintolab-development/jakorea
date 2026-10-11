import { getNoticeListPage } from '@/features/posts/api/notices/admin-notices-service'
import { postsQueryKeys } from '@/features/posts/api/posts-query-keys'
import { usePostsRemoteEnabled } from '@/features/posts/hooks/use-posts-remote-enabled'
import { useInfiniteLogList } from '@/features/logs/hooks/use-infinite-log-list'

export function useNoticeListQuery(searchParams: URLSearchParams, enabled = true) {
  const searchParamsKey = searchParams.toString()
  const remoteEnabled = usePostsRemoteEnabled('notices', enabled)

  return useInfiniteLogList({
    queryKey: postsQueryKeys.notices.list(searchParamsKey),
    queryKeyIdentity: searchParamsKey,
    queryFn: page =>
      getNoticeListPage(new URLSearchParams(searchParamsKey), page),
    enabled: remoteEnabled,
  })
}
