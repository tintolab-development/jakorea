import { useQuery } from '@tanstack/react-query'
import { getSettlementConfigRemote } from '@/features/settlement-management/api/settlement-configs/admin-settlement-configs-service'
import { settlementQueryKeys } from '@/features/settlement-management/api/settlement-query-keys'
import { useSettlementRemoteEnabled } from '@/features/settlement-management/hooks/use-settlement-remote-enabled'

export function useSettlementConfigSectionsQuery(enabled = true) {
  const remoteEnabled = useSettlementRemoteEnabled('settlementConfigs', enabled)

  return useQuery({
    queryKey: settlementQueryKeys.settlementConfigs.current(),
    queryFn: () => getSettlementConfigRemote(),
    enabled: remoteEnabled,
    staleTime: 60_000,
    retry: false,
    select: data => data.sections,
  })
}

export function useSettlementConfigQuery(enabled = true) {
  const remoteEnabled = useSettlementRemoteEnabled('settlementConfigs', enabled)

  return useQuery({
    queryKey: settlementQueryKeys.settlementConfigs.current(),
    queryFn: () => getSettlementConfigRemote(),
    enabled: remoteEnabled,
    staleTime: 60_000,
    retry: false,
  })
}
