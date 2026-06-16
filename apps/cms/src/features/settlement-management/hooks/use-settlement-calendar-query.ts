import { useQuery } from '@tanstack/react-query'
import {
  fetchSettlementCalendarDateRemote,
  fetchSettlementCalendarRemote,
  fetchSettlementCalendarSummaryRemote,
} from '@/features/settlement-management/api/settlement-api-client'
import { settlementQueryKeys } from '@/features/settlement-management/api/settlement-query-keys'
import { useSettlementRemoteEnabled } from '@/features/settlement-management/hooks/use-settlement-remote-enabled'

export function useSettlementCalendarQuery(
  fromDate: string | null,
  toDate: string | null,
  enabled = true
) {
  const remoteEnabled = useSettlementRemoteEnabled(
    'paymentOrders',
    enabled && Boolean(fromDate && toDate)
  )

  return useQuery({
    queryKey: settlementQueryKeys.calendar.range(fromDate ?? '', toDate ?? ''),
    queryFn: () => fetchSettlementCalendarRemote(fromDate!, toDate!),
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
