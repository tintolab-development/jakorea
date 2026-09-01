import { useQuery } from '@tanstack/react-query'
import { getPaymentOrdersListRemote } from '@/features/settlement-management/api/payment-orders/admin-payment-orders-service'
import { settlementQueryKeys } from '@/features/settlement-management/api/settlement-query-keys'
import { useSettlementRemoteEnabled } from '@/features/settlement-management/hooks/use-settlement-remote-enabled'
import {
  parsePaymentOrdersFiltersFromUrl,
  paymentOrdersListFilterQueryKey,
} from '@/pages/settlement-management/payment-orders-table.config'

export function usePaymentOrdersListQuery(
  searchParamsKey: string,
  enabled = true,
  viewMode: 'list' | 'calendar' = 'list'
) {
  const remoteEnabled = useSettlementRemoteEnabled('paymentOrders', enabled)
  const filters = parsePaymentOrdersFiltersFromUrl(new URLSearchParams(searchParamsKey))
  const groupBy = filters.exposureMode
  const filterKey = `${paymentOrdersListFilterQueryKey(new URLSearchParams(searchParamsKey))}|${viewMode}`

  return useQuery({
    queryKey: settlementQueryKeys.paymentOrders.list(groupBy, filterKey),
    queryFn: () => getPaymentOrdersListRemote(groupBy, { ...filters, viewMode }),
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
  })
}
