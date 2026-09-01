import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import type { Dayjs } from 'dayjs'
import {
  getPaymentOrdersDetailContextRemote,
  type PaymentOrdersDetailContextParams,
} from '@/features/settlement-management/api/payment-orders/admin-payment-orders-service'
import { settlementQueryKeys } from '@/features/settlement-management/api/settlement-query-keys'
import { useSettlementRemoteEnabled } from '@/features/settlement-management/hooks/use-settlement-remote-enabled'

export type PaymentOrdersDetailContextData = Awaited<
  ReturnType<typeof getPaymentOrdersDetailContextRemote>
>

export type PaymentOrdersDetailContextQueryResult = UseQueryResult<PaymentOrdersDetailContextData>

function paymentOrdersDetailDateRangeKey(dateRange: [Dayjs, Dayjs] | null | undefined): string {
  if (!dateRange?.[0] || !dateRange[1]) return 'all'
  return `${dateRange[0].format('YYYY-MM-DD')}_${dateRange[1].format('YYYY-MM-DD')}`
}

function toDetailContextParams(
  type: 'program' | 'instructor',
  aggregateKey: string,
  listPageDateRange: [Dayjs, Dayjs] | null | undefined
): PaymentOrdersDetailContextParams {
  const dateRange =
    listPageDateRange?.[0] && listPageDateRange[1]
      ? {
          from: listPageDateRange[0].format('YYYY-MM-DD'),
          to: listPageDateRange[1].format('YYYY-MM-DD'),
        }
      : null

  return { type, aggregateKey, dateRange }
}

export function usePaymentOrdersDetailContextQuery(
  type: 'program' | 'instructor',
  aggregateKey: string | null,
  listPageDateRange: [Dayjs, Dayjs] | null | undefined,
  enabled = true
) {
  const remoteEnabled = useSettlementRemoteEnabled(
    'paymentOrders',
    enabled && aggregateKey != null && aggregateKey !== ''
  )

  const dateRangeKey = paymentOrdersDetailDateRangeKey(listPageDateRange)

  return useQuery({
    queryKey: settlementQueryKeys.paymentOrders.detail(
      type,
      aggregateKey ?? '',
      dateRangeKey
    ),
    queryFn: () =>
      getPaymentOrdersDetailContextRemote(
        toDetailContextParams(type, aggregateKey ?? '', listPageDateRange)
      ),
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
  })
}
