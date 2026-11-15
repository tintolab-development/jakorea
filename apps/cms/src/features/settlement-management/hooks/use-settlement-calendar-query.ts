import { useQuery } from '@tanstack/react-query'
import {
  fetchSettlementCalendarDateRemote,
  fetchSettlementCalendarRemote,
  fetchSettlementCalendarSummaryRemote,
} from '@/features/settlement-management/api/settlement-api-client'
import { settlementQueryKeys } from '@/features/settlement-management/api/settlement-query-keys'
import type { PaymentOrderPayeeTypeFilter } from '@/pages/settlement-management/payment-orders-table.config'
import { useSettlementRemoteEnabled } from '@/features/settlement-management/hooks/use-settlement-remote-enabled'

export function useSettlementCalendarQuery(
  fromDate: string | null,
  toDate: string | null,
  enabled = true,
  /** 정산 대상자 구분 — `all`이면 전체 */
  payeeType: PaymentOrderPayeeTypeFilter = 'all'
) {
  const remoteEnabled = useSettlementRemoteEnabled(
    'paymentOrders',
    enabled && Boolean(fromDate && toDate)
  )

  return useQuery({
    queryKey: settlementQueryKeys.calendar.range(fromDate ?? '', toDate ?? '', payeeType),
    queryFn: () =>
      fetchSettlementCalendarRemote(
        fromDate!,
        toDate!,
        payeeType === 'all' ? undefined : payeeType
      ),
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
  })
}

export function useSettlementCalendarSummaryQuery(
  year: number,
  month: number,
  enabled = true
) {
  const remoteEnabled = useSettlementRemoteEnabled('paymentOrders', enabled)

  return useQuery({
    queryKey: settlementQueryKeys.calendar.summary(year, month),
    queryFn: () => fetchSettlementCalendarSummaryRemote(year, month),
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
  })
}

export function useSettlementCalendarDateQuery(date: string | null, enabled = true) {
  const remoteEnabled = useSettlementRemoteEnabled(
    'paymentOrders',
    enabled && Boolean(date)
  )

  return useQuery({
    queryKey: settlementQueryKeys.calendar.date(date ?? ''),
    queryFn: () => fetchSettlementCalendarDateRemote(date!),
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
  })
}
