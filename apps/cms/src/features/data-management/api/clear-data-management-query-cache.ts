import { dataManagementQueryKeys } from '@/features/data-management/api/data-management-query-keys'
import { queryClient } from '@/shared/lib/query-client'

/** 로그아웃·MFA 완료 등 인증 경계에서 캐시 교차 노출 방지 */
export function clearDataManagementQueryCache(): void {
  void queryClient.removeQueries({ queryKey: dataManagementQueryKeys.all })
}
