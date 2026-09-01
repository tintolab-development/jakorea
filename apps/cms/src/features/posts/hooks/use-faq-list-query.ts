import { useQuery } from '@tanstack/react-query'
import { getFaqList } from '@/features/posts/api/faqs/admin-faqs-service'
import { postsQueryKeys } from '@/features/posts/api/posts-query-keys'
import { usePostsRemoteEnabled } from '@/features/posts/hooks/use-posts-remote-enabled'

export function useFaqListQuery(searchParams: URLSearchParams, enabled = true) {
  const searchParamsKey = searchParams.toString()
  const remoteEnabled = usePostsRemoteEnabled('faqs', enabled)

  return useQuery({
    queryKey: postsQueryKeys.faqs.list(searchParamsKey),
    queryFn: () => getFaqList(new URLSearchParams(searchParamsKey)),
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
  })
}
