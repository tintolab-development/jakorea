import { settlementItemSettingSections } from '@/data/mock/settlement-item-settings'
import type { CmsSelectMultipleOption } from '@/shared/ui/cms-select-multiple'

/**
 * 일반 프로그램 등록 폼 `ProgramRegistrationWageInfoParagraph`와 동일한 지급 항목 옵션.
 * 데이터 출처: `settlementItemSettingSections` 중 `kind === 'payment'`.
 */
export function getTemplateRegistrationPaymentItemOptions(): CmsSelectMultipleOption[] {
  const section = settlementItemSettingSections.find(s => s.kind === 'payment')
  return (section?.items ?? []).map(item => ({
    value: item.id,
    label: item.title,
  }))
}
