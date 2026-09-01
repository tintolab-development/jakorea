import { useQuery } from '@tanstack/react-query'
import { getNoticeList } from '@/features/posts/api/notices/admin-notices-service'
import { postsQueryKeys } from '@/features/posts/api/posts-query-keys'
import { usePostsRemoteEnabled } from '@/features/posts/hooks/use-posts-remote-enabled'

export function useNoticeListQuery(searchParams: URLSearchParams, enabled = true) {
  const searchParamsKey = searchParams.toString()
  const remoteEnabled = usePostsRemoteEnabled('notices', enabled)

  return useQuery({
    queryKey: postsQueryKeys.notices.list(searchParamsKey),
    queryFn: () => getNoticeList(new URLSearchParams(searchParamsKey)),
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
  })
}
