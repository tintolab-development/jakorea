import { useQuery } from '@tanstack/react-query'
import { fetchSettlementDetailRemote } from '@/features/settlement-management/api/settlement-api-client'
import { settlementQueryKeys } from '@/features/settlement-management/api/settlement-query-keys'
import { useSettlementRemoteEnabled } from '@/features/settlement-management/hooks/use-settlement-remote-enabled'

export function useSettlementDetailQuery(settlementId: number | null | undefined, enabled = true) {
  const remoteEnabled = useSettlementRemoteEnabled(
    'paymentOrders',
    enabled && settlementId != null
  )

  return useQuery({
    queryKey: settlementQueryKeys.paymentOrders.settlement(settlementId ?? 0),
    queryFn: () => fetchSettlementDetailRemote(settlementId!),
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
  })
}
