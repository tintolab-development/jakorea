import { useQuery } from '@tanstack/react-query'
import { getAccountPaymentsListRemote } from '@/features/settlement-management/api/account-payments/admin-account-payments-service'
import {
  serializeAccountPaymentsListParamsKey,
  type AccountPaymentsListFilterInput,
} from '@/features/settlement-management/api/account-payments/build-account-payments-list-params'
import { settlementQueryKeys } from '@/features/settlement-management/api/settlement-query-keys'
import { useSettlementRemoteEnabled } from '@/features/settlement-management/hooks/use-settlement-remote-enabled'

export function useAccountPaymentsListQuery(
  filters: AccountPaymentsListFilterInput = {},
  enabled = true
) {
  const remoteEnabled = useSettlementRemoteEnabled('accountPayments', enabled)
  const listKey = serializeAccountPaymentsListParamsKey(filters)

  return useQuery({
    queryKey: settlementQueryKeys.accountPayments.list(listKey),
    queryFn: () => getAccountPaymentsListRemote(filters),
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
    placeholderData: previousData => previousData,
  })
}
