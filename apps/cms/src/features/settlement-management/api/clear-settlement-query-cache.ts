import { settlementQueryKeys } from '@/features/settlement-management/api/settlement-query-keys'
import { clearProgramAssignmentQueryCache } from '@/features/program/shared/lib/program-my-assignment'
import { queryClient } from '@/shared/lib/query-client'

/** 로그아웃·MFA 완료 등 인증 경계에서 캐시 교차 노출 방지 */
export function clearSettlementQueryCache(): void {
  discardAccountPaymentPlaintextCache()
  clearProgramAssignmentQueryCache()
  void queryClient.removeQueries({ queryKey: settlementQueryKeys.all })
}

/** 계좌 지급 상세 원문. 닫기·사용자 전환·권한 변경·로그아웃에서 진행 중 요청과 캐시를 버린다. */
export function discardAccountPaymentPlaintextCache(): void {
  void queryClient.cancelQueries({ queryKey: settlementQueryKeys.accountPayments.details() })
  queryClient.removeQueries({ queryKey: settlementQueryKeys.accountPayments.details() })
}
