import { useMemo } from 'react'
import type { SettlementItemSettingSection } from '@/data/mock/settlement-item-settings'
import { settlementItemSettingSections } from '@/data/mock/settlement-item-settings'
import { useSettlementConfigSectionsQuery } from '@/features/settlement-management/hooks/use-settlement-config-sections-query'
import { shouldUseSettlementRemote } from '@/features/settlement-management/hooks/use-settlement-remote-enabled'
import type { CmsSelectMultipleOption } from '@/shared/ui/cms-select-multiple'

/**
 * 정산 항목 설정(`/settlement-management/item-settings`)의 `지급 항목` 섹션 → 셀렉트 옵션.
 * `sections` 미전달 시 mock SSOT.
 */
export function getTemplateRegistrationPaymentItemOptions(
  sections: readonly SettlementItemSettingSection[] = settlementItemSettingSections
): CmsSelectMultipleOption[] {
  const section = sections.find(s => s.kind === 'payment')
  return (section?.items ?? []).map(item => ({
    value: item.id,
    label: item.title,
  }))
}

/**
 * 정산 항목 설정과 동일 소스의 지급 항목 옵션.
 * remote(`settlementConfigs`) 활성 시 API 섹션, 아니면 mock. 로딩·에러 시 mock 폴백.
 */
export function useTemplateRegistrationPaymentItemOptions(): CmsSelectMultipleOption[] {
  const remote = shouldUseSettlementRemote('settlementConfigs')
  const sectionsQuery = useSettlementConfigSectionsQuery(remote)

  return useMemo(() => {
    const sections =
      remote && sectionsQuery.data != null && sectionsQuery.data.length > 0
        ? sectionsQuery.data
        : settlementItemSettingSections
    return getTemplateRegistrationPaymentItemOptions(sections)
  }, [remote, sectionsQuery.data])
}
