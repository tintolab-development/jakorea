import { memberQueryKeys } from '@/features/user/api/member-query-keys'
import { clearMemberIdRegistry } from '@/features/user/api/member-id-registry'
import { queryClient } from '@/shared/lib/query-client'

/** 로그아웃·MFA 완료 등 인증 경계에서 캐시 교차 노출 방지 */
export function clearMemberQueryCache(): void {
  clearMemberIdRegistry()
  void queryClient.removeQueries({ queryKey: memberQueryKeys.all })
}
