import { useQuery } from '@tanstack/react-query'
import { getNoticeDetail } from '@/features/posts/api/notices/admin-notices-service'
import { postsQueryKeys } from '@/features/posts/api/posts-query-keys'
import { usePostsRemoteEnabled } from '@/features/posts/hooks/use-posts-remote-enabled'

export function useNoticeDetailQuery(noticeId: string | undefined) {
  const remoteEnabled = usePostsRemoteEnabled('notices', Boolean(noticeId))

  return useQuery({
    queryKey: postsQueryKeys.notices.detail(noticeId ?? ''),
    queryFn: () => getNoticeDetail(noticeId!),
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
  })
}
