import { mapSettlementConfigToSections } from '@/features/settlement-management/api/settlement-configs/map-settlement-config-sections'
import { fetchCurrentSettlementConfigRemote } from '@/features/settlement-management/api/settlement-api-client'
import type { SettlementItemSettingSection } from '@/data/mock/settlement-item-settings'
import type { SettlementConfigResponse } from '@/shared/api/generated/settlement/schemas'

export interface SettlementConfigQueryData {
  config: SettlementConfigResponse
  sections: SettlementItemSettingSection[]
}

export function buildSettlementConfigQueryData(
  config: SettlementConfigResponse
): SettlementConfigQueryData {
  return {
    config,
    sections: mapSettlementConfigToSections(config),
  }
}

export async function getSettlementConfigRemote(): Promise<SettlementConfigQueryData> {
  const config = await fetchCurrentSettlementConfigRemote()
  return buildSettlementConfigQueryData(config)
}

/** @deprecated sections only — prefer getSettlementConfigRemote */
export async function getSettlementConfigSectionsRemote(): Promise<SettlementItemSettingSection[]> {
  const { sections } = await getSettlementConfigRemote()
  return sections
}
