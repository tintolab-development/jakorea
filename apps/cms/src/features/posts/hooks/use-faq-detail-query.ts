import { useQuery } from '@tanstack/react-query'
import { getFaqDetail } from '@/features/posts/api/faqs/admin-faqs-service'
import { postsQueryKeys } from '@/features/posts/api/posts-query-keys'
import { usePostsRemoteEnabled } from '@/features/posts/hooks/use-posts-remote-enabled'

export function useFaqDetailQuery(faqId: string | undefined, options?: { enabled?: boolean }) {
  const remoteEnabled = usePostsRemoteEnabled('faqs', Boolean(faqId))

  return useQuery({
    queryKey: postsQueryKeys.faqs.detail(faqId ?? ''),
    queryFn: () => getFaqDetail(faqId!),
    enabled: remoteEnabled && options?.enabled !== false,
    staleTime: 30_000,
    retry: false,
  })
}
