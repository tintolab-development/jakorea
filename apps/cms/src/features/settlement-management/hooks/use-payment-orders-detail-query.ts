import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { getPaymentOrdersDetailContextRemote } from '@/features/settlement-management/api/payment-orders/admin-payment-orders-service'
import { settlementQueryKeys } from '@/features/settlement-management/api/settlement-query-keys'
import { useSettlementRemoteEnabled } from '@/features/settlement-management/hooks/use-settlement-remote-enabled'

export type PaymentOrdersDetailContextData = Awaited<
  ReturnType<typeof getPaymentOrdersDetailContextRemote>
>

export type PaymentOrdersDetailContextQueryResult = UseQueryResult<PaymentOrdersDetailContextData>

export function usePaymentOrdersDetailContextQuery(
  type: 'program' | 'instructor',
  aggregateKey: string | null,
  enabled = true
) {
  const remoteEnabled = useSettlementRemoteEnabled(
    'paymentOrders',
    enabled && aggregateKey != null && aggregateKey !== ''
  )

  return useQuery({
    queryKey: settlementQueryKeys.paymentOrders.detail(type, aggregateKey ?? ''),
    queryFn: () => getPaymentOrdersDetailContextRemote(),
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
  })
}
