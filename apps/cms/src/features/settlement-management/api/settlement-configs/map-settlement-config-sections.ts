import type {
  SettlementItemSettingCategoryKind,
  SettlementItemSettingIconKey,
  SettlementItemSettingRow,
  SettlementItemSettingSection,
} from '@/features/settlement-management/model/settlement-item-settings'
import {
  PAYMENT_ITEM_TYPE_ORDER,
  sortByCatalogOrder,
  WAGE_ITEM_TYPE_ORDER,
} from '@/features/settlement-management/api/settlement-configs/settlement-config-catalog-order'
import { readPaymentItemEligiblePayeeTypes } from '@/features/settlement-management/lib/settlement-payment-item-payee'
import type { SettlementConfigResponse } from '@/shared/api/generated/settlement/schemas'
import { PaymentItemResponsePaymentItemType } from '@/shared/api/generated/settlement/schemas/paymentItemResponsePaymentItemType'
import { WageItemResponseWageItemType } from '@/shared/api/generated/settlement/schemas/wageItemResponseWageItemType'
import {
  getCatalogSettlementItemDescriptionByPaymentType,
  getCatalogSettlementItemDescriptionByWageType,
  getCatalogSettlementItemDescriptionForWithholding,
} from '@/features/settlement-management/model/settlement-item-setting-detail'

const WAGE_TYPE_ICON: Record<string, SettlementItemSettingIconKey> = {
  [WageItemResponseWageItemType.TIER1]: 'wage_tier1',
  [WageItemResponseWageItemType.TIER2]: 'wage_tier2',
  [WageItemResponseWageItemType.TIER3]: 'wage_tier3',
  [WageItemResponseWageItemType.SPECIAL_LECTURE]: 'wage_special_lecture',
  [WageItemResponseWageItemType.OTHER_LABOR]: 'wage_other_labor',
  [WageItemResponseWageItemType.GEMINI]: 'wage_gemini',
}

const PAYMENT_TYPE_ICON: Record<string, SettlementItemSettingIconKey> = {
  [PaymentItemResponsePaymentItemType.TRANSPORT_INSTRUCTOR]: 'pay_transport',
  [PaymentItemResponsePaymentItemType.TRANSPORT_STUDENT]: 'pay_transport',
  [PaymentItemResponsePaymentItemType.MEAL]: 'pay_meal',
  [PaymentItemResponsePaymentItemType.LODGING_GENERAL]: 'pay_lodging',
  [PaymentItemResponsePaymentItemType.LODGING_1C1S]: 'pay_lodging',
  [PaymentItemResponsePaymentItemType.ACTIVITY]: 'pay_activity',
}

const ICON_KEYS = new Set<SettlementItemSettingIconKey>([
  'wage_tier1',
  'wage_tier2',
  'wage_tier3',
  'wage_special_lecture',
  'wage_other_labor',
  'wage_gemini',
  'pay_transport',
  'pay_lodging',
  'pay_meal',
  'pay_activity',
  'deduct_business_33',
])

function asIconKey(value: string | undefined): SettlementItemSettingIconKey | undefined {
  if (!value) return undefined
  return ICON_KEYS.has(value as SettlementItemSettingIconKey)
    ? (value as SettlementItemSettingIconKey)
    : undefined
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

function formatPaymentDescription(item: {
  description?: string
  paymentItemType?: string
}): string {
  const trimmed = item.description?.trim()
  if (trimmed) return trimmed
  return getCatalogSettlementItemDescriptionByPaymentType(item.paymentItemType) ?? ''
}

function normalizeWageType(value: string | undefined): string {
  return value?.trim().toUpperCase() ?? ''
}

function normalizePaymentType(value: string | undefined): string {
  return value?.trim().toUpperCase() ?? ''
}

export function mapSettlementConfigToSections(
  config: SettlementConfigResponse
): SettlementItemSettingSection[] {
  const wageItems: SettlementItemSettingRow[] = sortByCatalogOrder(
    config.wageItems ?? [],
    item => normalizeWageType(item.wageItemType),
    WAGE_ITEM_TYPE_ORDER
  ).map(item => {
    const wageItemType = normalizeWageType(item.wageItemType)
    const iconKey =
      asIconKey(item.iconKey) ?? WAGE_TYPE_ICON[wageItemType] ?? 'wage_tier3'
    return {
      id: item.id != null ? `w-${item.id}` : `w-${wageItemType}`,
      apiItemId: item.id,
      sectionKind: 'wage' as const,
      wageItemType,
      layout: item.layout,
      title: item.name ?? '임금 항목',
      description:
        item.description?.trim() ||
        getCatalogSettlementItemDescriptionByWageType(wageItemType) ||
        '',
      iconKey,
      emojiOverride: item.emojiOverride ?? null,
    }
  })

  const paymentItems: SettlementItemSettingRow[] = sortByCatalogOrder(
    (config.paymentItems ?? []).filter(item => item.useYn !== false),
    item => normalizePaymentType(item.paymentItemType),
    PAYMENT_ITEM_TYPE_ORDER
  ).map(item => {
    const paymentItemType = normalizePaymentType(item.paymentItemType)
    const iconKey =
      asIconKey(item.iconKey) ?? PAYMENT_TYPE_ICON[paymentItemType] ?? 'pay_transport'
    return {
      id: item.id != null ? `p-${item.id}` : `p-${paymentItemType}`,
      apiItemId: item.id,
      sectionKind: 'payment' as const,
      paymentItemType,
      // ACTIVITY wire layout = activity (meal/volunteerActivity 정규화)
      layout:
        paymentItemType === 'ACTIVITY'
          ? 'activity'
          : item.layout === 'volunteerActivity'
            ? 'activity'
            : item.layout,
      title: item.itemName ?? '지급 항목',
      description: formatPaymentDescription({ ...item, paymentItemType }),
      iconKey,
      emojiOverride: item.emojiOverride ?? null,
      eligiblePayeeTypes: readPaymentItemEligiblePayeeTypes(item),
    }
  })

  const deductionItems: SettlementItemSettingRow[] = (config.deductionItems ?? [])
    .filter(item => item.useYn !== false)
    .map(item => {
      const name = item.itemName?.trim() || '공제 항목'
      const description = item.description?.trim()
      const isWithholding =
        item.layout === 'withholdingDailyWorker' ||
        name === '일용근로자 원천징수세액' ||
        name === '원천징수세액' ||
        name === '원천징수'
      return {
        id: item.id != null ? `d-${item.id}` : `d-${name}`,
        apiItemId: item.id,
        sectionKind: 'deduction' as const,
        layout: item.layout ?? (isWithholding ? 'withholdingDailyWorker' : item.layout),
        title: name,
        description:
          description ||
          (isWithholding ? getCatalogSettlementItemDescriptionForWithholding() : ''),
        iconKey: asIconKey(item.iconKey) ?? 'deduct_business_33',
        emojiOverride: item.emojiOverride ?? null,
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
    sections.push({
      kind: 'deduction',
      sectionTitle: sectionTitle('deduction'),
      items: deductionItems,
    })
  }
  return sections
}
