import { queryOptions, useQuery } from '@tanstack/react-query'
import { getAccountPaymentDetailRemote } from '@/features/settlement-management/api/account-payments/admin-account-payments-service'
import { settlementQueryKeys } from '@/features/settlement-management/api/settlement-query-keys'
import { useSettlementRemoteEnabled } from '@/features/settlement-management/hooks/use-settlement-remote-enabled'
import type { AccountPaymentRow } from '@/data/mock/account-payments-list'

const ACCOUNT_PAYMENT_DETAIL_STALE_TIME_MS = 60_000
const ACCOUNT_PAYMENT_DETAIL_GC_TIME_MS = 10 * 60_000

export function accountPaymentDetailQueryOptions(row: AccountPaymentRow) {
  return queryOptions({
    queryKey: settlementQueryKeys.accountPayments.detail(row.id),
    queryFn: () => getAccountPaymentDetailRemote(row),
    staleTime: ACCOUNT_PAYMENT_DETAIL_STALE_TIME_MS,
    gcTime: ACCOUNT_PAYMENT_DETAIL_GC_TIME_MS,
    retry: false,
  })
}

export function useAccountPaymentDetailQuery(row: AccountPaymentRow | null, open: boolean) {
  const remoteEnabled = useSettlementRemoteEnabled(
    'accountPayments',
    open && row != null && row.accountPaymentId != null
  )

  return useQuery({
    ...(row
      ? accountPaymentDetailQueryOptions(row)
      : {
          queryKey: settlementQueryKeys.accountPayments.detail(''),
          queryFn: async () => {
            throw new Error('계좌 지급 상세 행이 없습니다.')
          },
        }),
    enabled: remoteEnabled,
  })
}
