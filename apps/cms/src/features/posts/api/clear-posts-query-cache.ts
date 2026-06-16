import { postsQueryKeys } from '@/features/posts/api/posts-query-keys'
import { queryClient } from '@/shared/lib/query-client'

/** 로그아웃·MFA 완료 등 인증 경계에서 캐시 교차 노출 방지 */
export function clearPostsQueryCache(): void {
  void queryClient.removeQueries({ queryKey: postsQueryKeys.all })
}
