import { settlementQueryKeys } from '@/features/settlement-management/api/settlement-query-keys'
import { queryClient } from '@/shared/lib/query-client'

/** 로그아웃·MFA 완료 등 인증 경계에서 캐시 교차 노출 방지 */
export function clearSettlementQueryCache(): void {
  void queryClient.removeQueries({ queryKey: settlementQueryKeys.all })
}
