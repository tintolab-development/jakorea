import type { QueryClient } from '@tanstack/react-query'
import { settlementQueryKeys } from '@/features/settlement-management/api/settlement-query-keys'

/**
 * 지급조서 ↔ 계좌 지급 원장 연동 캐시.
 * confirm / reject / paid / failed 이후 한쪽만 무효화하면 다른 화면이 stale이 된다.
 */
export async function invalidateSettlementLedgerCaches(queryClient: QueryClient): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: settlementQueryKeys.paymentOrders.all() }),
    queryClient.invalidateQueries({ queryKey: settlementQueryKeys.calendar.all() }),
    queryClient.invalidateQueries({ queryKey: settlementQueryKeys.accountPayments.lists() }),
    queryClient.invalidateQueries({ queryKey: settlementQueryKeys.accountPayments.details() }),
    queryClient.invalidateQueries({
      queryKey: [...settlementQueryKeys.accountPayments.all(), 'budgetSummary'],
    }),
  ])
}
