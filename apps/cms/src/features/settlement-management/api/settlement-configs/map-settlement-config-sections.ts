import type {
  SettlementItemSettingCategoryKind,
  SettlementItemSettingIconKey,
  SettlementItemSettingRow,
  SettlementItemSettingSection,
} from '@/data/mock/settlement-item-settings'
import type { SettlementConfigResponse } from '@/shared/api/generated/settlement/schemas'

const WAGE_TYPE_ICON: Record<string, SettlementItemSettingIconKey> = {
  TIER1: 'wage_tier1',
  TIER2: 'wage_tier2',
  TIER3: 'wage_tier3',
  SPECIAL_LECTURE: 'wage_special_lecture',
  OTHER_LABOR: 'wage_other_labor',
  GEMINI: 'wage_gemini',
  ASSISTANT: 'wage_assistant',
  MULTI_INSTRUCTOR: 'wage_multi_instructor',
  SIMPLE_LABOR: 'wage_simple_labor',
}

const ICON_KEYS = new Set<SettlementItemSettingIconKey>([
  'wage_tier1',
  'wage_tier2',
  'wage_tier3',
  'wage_special_lecture',
  'wage_other_labor',
  'wage_gemini',
  'wage_assistant',
  'wage_multi_instructor',
  'wage_simple_labor',
  'pay_transport',
  'pay_lodging',
  'pay_meal',
  'pay_activity',
  'pay_meeting',
  'pay_volunteer',
  'deduct_business_33',
  'deduct_other_88',
  'deduct_other_44',
  'deduct_other_22',
])

function asIconKey(value: string | undefined): SettlementItemSettingIconKey | undefined {
  if (!value) return undefined
  return ICON_KEYS.has(value as SettlementItemSettingIconKey)
    ? (value as SettlementItemSettingIconKey)
    : undefined
}

function guessPaymentIcon(name: string): SettlementItemSettingIconKey {
  if (name.includes('교통')) return 'pay_transport'
  if (name.includes('숙박')) return 'pay_lodging'
  if (name.includes('식사')) return 'pay_meal'
  if (name.includes('회의')) return 'pay_meeting'
  if (name.includes('활동') || name.includes('자원봉사')) return 'pay_activity'
  return 'pay_transport'
}

function guessDeductionIcon(name: string): SettlementItemSettingIconKey {
  if (name.includes('33')) return 'deduct_business_33'
  if (name.includes('88')) return 'deduct_other_88'
  if (name.includes('44')) return 'deduct_other_44'
  return 'deduct_other_22'
}

function sectionTitle(kind: SettlementItemSettingCategoryKind): string {
  switch (kind) {
    case 'wage':
      return '임금 항목'
    case 'payment':
      return '지급 항목'
    case 'deduction':
      return '공제 항목'
  }
}

export function mapSettlementConfigToSections(
  config: SettlementConfigResponse
): SettlementItemSettingSection[] {
  const wageItems: SettlementItemSettingRow[] = (config.wageItems ?? []).map(item => {
      const type = item.wageItemType?.toUpperCase() ?? ''
      const iconKey =
        asIconKey(item.iconKey) ?? WAGE_TYPE_ICON[type] ?? 'wage_tier3'
      return {
        id: item.id != null ? `w-${item.id}` : `w-${item.name}`,
        apiItemId: item.id,
        title: item.name ?? '임금 항목',
        description:
          item.description?.trim() ||
          (item.amount != null
            ? `${item.amount.toLocaleString('ko-KR')}원`
            : '상세 기준에 따라 적용되는 임금입니다.'),
        iconKey,
      }
    })

  const paymentItems: SettlementItemSettingRow[] = (config.paymentItems ?? [])
    .filter(item => item.useYn !== false)
    .map(item => {
      const name = item.itemName ?? '지급 항목'
      return {
        id: item.id != null ? `p-${item.id}` : `p-${name}`,
        apiItemId: item.id,
        title: name,
        description:
          item.description?.trim() ||
          (item.maxAmount != null
            ? `최대 ${item.maxAmount.toLocaleString('ko-KR')}원`
            : '상세 기준에 따라 적용되는 지급 항목입니다.'),
        iconKey: asIconKey(item.iconKey) ?? guessPaymentIcon(name),
      }
    })

  const deductionItems: SettlementItemSettingRow[] = (config.deductionItems ?? [])
    .filter(item => item.useYn !== false)
    .map(item => {
      const name = item.itemName ?? '공제 항목'
      return {
        id: item.id != null ? `d-${item.id}` : `d-${name}`,
        apiItemId: item.id,
        title: name,
        description:
          item.description?.trim() ||
          (item.deductionRate
            ? `공제율 ${item.deductionRate}`
            : '상세 기준에 따라 적용되는 공제 항목입니다.'),
        iconKey: asIconKey(item.iconKey) ?? guessDeductionIcon(name),
      }
    })

  const sections: SettlementItemSettingSection[] = []
  if (wageItems.length > 0) {
    sections.push({ kind: 'wage', sectionTitle: sectionTitle('wage'), items: wageItems })
  }
  if (paymentItems.length > 0) {
    sections.push({ kind: 'payment', sectionTitle: sectionTitle('payment'), items: paymentItems })
  }
  if (deductionItems.length > 0) {
    sections.push({ kind: 'deduction', sectionTitle: sectionTitle('deduction'), items: deductionItems })
  }
  return sections
}
