import { useQuery } from '@tanstack/react-query'
import { fetchSettlementBudgetSummaryRemote } from '@/features/settlement-management/api/settlement-api-client'
import { settlementQueryKeys } from '@/features/settlement-management/api/settlement-query-keys'
import { useSettlementRemoteEnabled } from '@/features/settlement-management/hooks/use-settlement-remote-enabled'

export function useSettlementBudgetSummaryQuery(year: number, enabled = true) {
  const remoteEnabled = useSettlementRemoteEnabled('accountPayments', enabled)

  return useQuery({
    queryKey: settlementQueryKeys.accountPayments.budgetSummary(year),
    queryFn: () => fetchSettlementBudgetSummaryRemote({ year }),
    enabled: remoteEnabled,
    staleTime: 60_000,
    retry: false,
  })
}
