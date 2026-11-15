import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import type { Dayjs } from 'dayjs'
import {
  getPaymentOrdersDetailContextRemote,
  type PaymentOrdersDetailContextParams,
} from '@/features/settlement-management/api/payment-orders/admin-payment-orders-service'
import { settlementQueryKeys } from '@/features/settlement-management/api/settlement-query-keys'
import type { PaymentOrderPayeeTypeFilter } from '@/pages/settlement-management/payment-orders-table.config'
import { useSettlementRemoteEnabled } from '@/features/settlement-management/hooks/use-settlement-remote-enabled'

export type PaymentOrdersDetailContextData = Awaited<
  ReturnType<typeof getPaymentOrdersDetailContextRemote>
>

export type PaymentOrdersDetailContextQueryResult = UseQueryResult<PaymentOrdersDetailContextData>

function paymentOrdersDetailDateRangeKey(
  dateRange: [Dayjs | null, Dayjs | null] | null | undefined
): string {
  if (!dateRange?.[0] && !dateRange?.[1]) return 'all'
  const from = dateRange?.[0]?.format('YYYY-MM-DD') ?? ''
  const to = dateRange?.[1]?.format('YYYY-MM-DD') ?? ''
  return `${from}_${to}`
}

function toDetailContextParams(
  type: 'program' | 'instructor',
  aggregateKey: string,
  listPageDateRange: [Dayjs | null, Dayjs | null] | null | undefined,
  listPagePayeeType: PaymentOrderPayeeTypeFilter
): PaymentOrdersDetailContextParams {
  const from = listPageDateRange?.[0]?.format('YYYY-MM-DD')
  const to = listPageDateRange?.[1]?.format('YYYY-MM-DD')
  const dateRange = from || to ? { ...(from ? { from } : {}), ...(to ? { to } : {}) } : null

  return { type, aggregateKey, dateRange, payeeType: listPagePayeeType }
}

export function usePaymentOrdersDetailContextQuery(
  type: 'program' | 'instructor',
  aggregateKey: string | null,
  listPageDateRange: [Dayjs | null, Dayjs | null] | null | undefined,
  enabled = true,
  /** 목록에 조회 적용된 정산 대상자 구분 */
  listPagePayeeType: PaymentOrderPayeeTypeFilter = 'all'
) {
  const remoteEnabled = useSettlementRemoteEnabled(
    'paymentOrders',
    enabled && aggregateKey != null && aggregateKey !== ''
  )

  const dateRangeKey = `${paymentOrdersDetailDateRangeKey(listPageDateRange)}|${listPagePayeeType}`

  return useQuery({
    queryKey: settlementQueryKeys.paymentOrders.detail(
      type,
      aggregateKey ?? '',
      dateRangeKey
    ),
    queryFn: () =>
      getPaymentOrdersDetailContextRemote(
        toDetailContextParams(type, aggregateKey ?? '', listPageDateRange, listPagePayeeType)
      ),
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
  })
}
