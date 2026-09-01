import { useQuery } from '@tanstack/react-query'
import { fetchSettlementBudgetSummaryRemote } from '@/features/settlement-management/api/settlement-api-client'
import { settlementQueryKeys } from '@/features/settlement-management/api/settlement-query-keys'
import { useSettlementRemoteEnabled } from '@/features/settlement-management/hooks/use-settlement-remote-enabled'

export type SettlementBudgetSummaryQueryParams = {
  year: number
  /** 계좌 지급 목록과 동일 이체 예정일 구간 — 있으면 year 기본 구간보다 우선 */
  fromDate?: string
  toDate?: string
}

export function useSettlementBudgetSummaryQuery(
  params: SettlementBudgetSummaryQueryParams,
  enabled = true
) {
  const { year, fromDate, toDate } = params
  const remoteEnabled = useSettlementRemoteEnabled('accountPayments', enabled)
  const hasDateRange = Boolean(fromDate && toDate)

  return useQuery({
    queryKey: settlementQueryKeys.accountPayments.budgetSummary(year, fromDate, toDate),
    queryFn: () =>
      fetchSettlementBudgetSummaryRemote({
        year,
        ...(hasDateRange ? { fromDate, toDate } : {}),
      }),
    enabled: remoteEnabled,
    staleTime: 60_000,
    retry: false,
  })
}
