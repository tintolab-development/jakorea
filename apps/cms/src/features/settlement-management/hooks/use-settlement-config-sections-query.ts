import { useQuery } from '@tanstack/react-query'
import { getSettlementConfigSectionsRemote } from '@/features/settlement-management/api/settlement-configs/admin-settlement-configs-service'
import { settlementQueryKeys } from '@/features/settlement-management/api/settlement-query-keys'
import { useSettlementRemoteEnabled } from '@/features/settlement-management/hooks/use-settlement-remote-enabled'

export function useSettlementConfigSectionsQuery(enabled = true) {
  const remoteEnabled = useSettlementRemoteEnabled('settlementConfigs', enabled)

  return useQuery({
    queryKey: settlementQueryKeys.settlementConfigs.current(),
    queryFn: () => getSettlementConfigSectionsRemote(),
    enabled: remoteEnabled,
    staleTime: 60_000,
    retry: false,
  })
}
