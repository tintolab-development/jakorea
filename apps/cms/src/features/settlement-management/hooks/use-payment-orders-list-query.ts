import { useQuery } from '@tanstack/react-query'
import { getPaymentOrdersListRemote } from '@/features/settlement-management/api/payment-orders/admin-payment-orders-service'
import { settlementQueryKeys } from '@/features/settlement-management/api/settlement-query-keys'
import { useSettlementRemoteEnabled } from '@/features/settlement-management/hooks/use-settlement-remote-enabled'
import { parsePaymentOrdersFiltersFromUrl } from '@/pages/settlement-management/payment-orders-table.config'

export function usePaymentOrdersListQuery(searchParamsKey: string, enabled = true) {
  const remoteEnabled = useSettlementRemoteEnabled('paymentOrders', enabled)

  return useQuery({
    queryKey: settlementQueryKeys.paymentOrders.list(searchParamsKey),
    queryFn: () => {
      const filters = parsePaymentOrdersFiltersFromUrl(new URLSearchParams(searchParamsKey))
      return getPaymentOrdersListRemote(filters)
    },
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
  })
}
