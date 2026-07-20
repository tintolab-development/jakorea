import { mapSettlementConfigToSections } from '@/features/settlement-management/api/settlement-configs/map-settlement-config-sections'
import { fetchCurrentSettlementConfigRemote } from '@/features/settlement-management/api/settlement-api-client'
import type { SettlementItemSettingSection } from '@/data/mock/settlement-item-settings'

export async function getSettlementConfigSectionsRemote(): Promise<SettlementItemSettingSection[]> {
  const config = await fetchCurrentSettlementConfigRemote()
  return mapSettlementConfigToSections(config)
}
