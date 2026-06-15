import { useQuery } from '@tanstack/react-query'
import { getAccountPaymentDetailRemote } from '@/features/settlement-management/api/account-payments/admin-account-payments-service'
import { settlementQueryKeys } from '@/features/settlement-management/api/settlement-query-keys'
import { useSettlementRemoteEnabled } from '@/features/settlement-management/hooks/use-settlement-remote-enabled'
import type { AccountPaymentRow } from '@/data/mock/account-payments-list'

export function useAccountPaymentDetailQuery(row: AccountPaymentRow | null, open: boolean) {
  const rowId = row?.id ?? ''
  const remoteEnabled = useSettlementRemoteEnabled(
    'accountPayments',
    open && row != null && row.settlementId != null
  )

  return useQuery({
    queryKey: settlementQueryKeys.accountPayments.detail(rowId),
    queryFn: () => getAccountPaymentDetailRemote(row!),
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
  })
}
