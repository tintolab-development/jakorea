import { useQuery } from '@tanstack/react-query'
import { getAccountPaymentsListRemote } from '@/features/settlement-management/api/account-payments/admin-account-payments-service'
import { settlementQueryKeys } from '@/features/settlement-management/api/settlement-query-keys'
import { useSettlementRemoteEnabled } from '@/features/settlement-management/hooks/use-settlement-remote-enabled'

export function useAccountPaymentsListQuery(searchParamsKey: string, enabled = true) {
  const remoteEnabled = useSettlementRemoteEnabled('accountPayments', enabled)

  return useQuery({
    queryKey: settlementQueryKeys.accountPayments.list(searchParamsKey),
    queryFn: () => getAccountPaymentsListRemote(),
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
  })
}
