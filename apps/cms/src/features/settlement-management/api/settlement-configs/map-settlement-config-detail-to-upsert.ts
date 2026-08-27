import type { SettlementItemSettingDetail } from '@/data/mock/settlement-item-setting-detail.mock'
import type { SettlementItemSettingRow } from '@/data/mock/settlement-item-settings'
import {
  mapDeductionItemToSettingDetail,
  mapPaymentItemToSettingDetail,
  mapWageItemToSettingDetail,
} from '@/features/settlement-management/api/settlement-configs/map-settlement-config-item-detail'
import type {
  DeductionItemResponse,
  PaymentItemResponse,
  SettlementConfigResponse,
  SettlementConfigUpdateRequest,
  WageItemResponse,
} from '@/shared/api/generated/settlement/schemas'

function mergeDetailJson(
  existing: string | undefined,
  patch: Record<string, unknown>
): string {
  let base: Record<string, unknown> = {}
  if (existing?.trim()) {
    try {
      const parsed: unknown = JSON.parse(existing)
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        base = parsed as Record<string, unknown>
      }
    } catch {
      base = {}
    }
  }
  return JSON.stringify({ ...base, ...patch })
}

export function resolveSettingDetailFromConfig(
  config: SettlementConfigResponse,
  item: SettlementItemSettingRow
): SettlementItemSettingDetail {
  if (item.sectionKind === 'wage' && item.apiItemId != null) {
    const wage = config.wageItems?.find(w => w.id === item.apiItemId)
    if (wage) return mapWageItemToSettingDetail(wage)
  }
  if (item.sectionKind === 'payment' && item.apiItemId != null) {
    const payment = config.paymentItems?.find(p => p.id === item.apiItemId)
    if (payment) return mapPaymentItemToSettingDetail(payment)
  }
  if (item.sectionKind === 'deduction' && item.apiItemId != null) {
    const deduction = config.deductionItems?.find(d => d.id === item.apiItemId)
    if (deduction) return mapDeductionItemToSettingDetail(deduction)
  }
  throw new Error(`설정 항목을 찾을 수 없습니다: ${item.id}`)
}

function wageItemToUpsert(
  item: WageItemResponse,
  detail: SettlementItemSettingDetail,
  meta: { title: string; description: string; emojiOverride?: string | null }
): NonNullable<SettlementConfigUpdateRequest['wageItems']>[number] {
  const detailPatch: Record<string, unknown> = {
    compareKind: detail.compareKind,
    basicFeeWon: detail.basicFeeWon,
    longDistanceFeeWon: detail.longDistanceFeeWon,
  }
  if (detail.layout === 'gemini') {
    detailPatch.session1Won = detail.geminiSession1Won ?? 0
    detailPatch.session2Won = detail.geminiSession2Won
    detailPatch.session3Won = detail.geminiSession3Won
    detailPatch.session4Won = detail.geminiSession4Won
  }

  const rateItems =
    detail.layout === 'gemini'
      ? [
          { unitCount: 1, amount: detail.geminiSession1Won ?? 0 },
          { unitCount: 2, amount: detail.geminiSession2Won ?? 0 },
          { unitCount: 3, amount: detail.geminiSession3Won ?? 0 },
          { unitCount: 4, amount: detail.geminiSession4Won ?? 0 },
        ]
      : item.rateItems?.map(rate => ({
          id: rate.id,
          unitCount: rate.unitCount,
          amount: rate.amount,
        }))

  return {
    id: item.id,
    wageItemType: item.wageItemType,
    itemName: meta.title,
    amount: item.amount,
    calculationUnit: detail.basisUnit,
    editableYn: item.editableYn,
    iconKey: item.iconKey,
    emojiOverride: meta.emojiOverride ?? item.emojiOverride,
    layout: item.layout,
    basisHours: detail.basisHours,
    maxLimitWon: detail.maxLimitWon ?? undefined,
    qualificationLines: detail.qualificationLines,
    remarkLines: detail.remarkLines,
    description: meta.description,
    detailJson: mergeDetailJson(item.detailJson, detailPatch),
    rateItems,
  }
}

function paymentItemToUpsert(
  item: PaymentItemResponse,
  detail: SettlementItemSettingDetail,
  meta: { title: string; description: string; emojiOverride?: string | null }
): NonNullable<SettlementConfigUpdateRequest['paymentItems']>[number] {
  const detailPatch: Record<string, unknown> = {
    evidenceSubmission: detail.evidenceSubmission,
    qualificationLines: detail.qualificationLines,
    remarkLines: detail.remarkLines,
  }
  if (detail.layout === 'transport') {
    detailPatch.transportCommuteMode = detail.transportCommuteMode
    detailPatch.minDistanceKm = detail.basisHours
    detailPatch.minOneWayKm = detail.basisHours
  }

  return {
    id: item.id,
    paymentItemType: item.paymentItemType,
    itemName: meta.title,
    maxAmount: detail.maxLimitWon ?? item.maxAmount,
    maxLimitWon: detail.maxLimitWon ?? undefined,
    taxableYn: item.taxableYn,
    useYn: item.useYn,
    iconKey: item.iconKey,
    emojiOverride: meta.emojiOverride ?? item.emojiOverride,
    layout: item.layout ?? detail.layout,
    description: meta.description,
    detailJson: mergeDetailJson(item.detailJson, detailPatch),
  }
}

function deductionItemToUpsert(
  item: DeductionItemResponse,
  detail: SettlementItemSettingDetail,
  meta: { title: string; description: string; emojiOverride?: string | null }
): NonNullable<SettlementConfigUpdateRequest['deductionItems']>[number] {
  return {
    id: item.id,
    itemName: meta.title,
    deductionRate: item.deductionRate,
    deductionAmount: item.deductionAmount,
    useYn: item.useYn,
    iconKey: item.iconKey,
    emojiOverride: meta.emojiOverride ?? item.emojiOverride,
    layout: item.layout ?? detail.layout,
    description: meta.description,
    detailJson: mergeDetailJson(item.detailJson, {
      qualificationLines: detail.qualificationLines,
      remarkLines: detail.remarkLines,
      withholdingExclusionMaxWon: detail.withholdingExclusionMaxWon,
      withholdingEarnedIncomeDeductionWon: detail.withholdingEarnedIncomeDeductionWon,
      withholdingTaxRateBusiness: detail.withholdingTaxRateBusiness,
      withholdingTaxRateOther: detail.withholdingTaxRateOther,
      withholdingTaxRatePrize: detail.withholdingTaxRatePrize,
      withholdingTaxRateInterview: detail.withholdingTaxRateInterview,
    }),
  }
}

export function buildSettlementConfigUpdateRequest(
  config: SettlementConfigResponse,
  item: SettlementItemSettingRow,
  detail: SettlementItemSettingDetail,
  meta: { title: string; description: string; emojiOverride?: string | null }
): SettlementConfigUpdateRequest {
  const wageItems = (config.wageItems ?? []).map(wage => {
    if (item.sectionKind === 'wage' && wage.id === item.apiItemId) {
      return wageItemToUpsert(wage, detail, meta)
    }
    return wageItemToUpsert(wage, mapWageItemToSettingDetail(wage), {
      title: wage.name ?? '',
      description: wage.description ?? '',
      emojiOverride: wage.emojiOverride,
    })
  })

  const paymentItems = (config.paymentItems ?? []).map(payment => {
    if (item.sectionKind === 'payment' && payment.id === item.apiItemId) {
      return paymentItemToUpsert(payment, detail, meta)
    }
    return paymentItemToUpsert(payment, mapPaymentItemToSettingDetail(payment), {
      title: payment.itemName ?? '',
      description: payment.description ?? '',
      emojiOverride: payment.emojiOverride,
    })
  })

  const deductionItems = (config.deductionItems ?? []).map(deduction => {
    if (item.sectionKind === 'deduction' && deduction.id === item.apiItemId) {
      return deductionItemToUpsert(deduction, detail, meta)
    }
    return deductionItemToUpsert(deduction, mapDeductionItemToSettingDetail(deduction), {
      title: deduction.itemName ?? '',
      description: deduction.description ?? '',
      emojiOverride: deduction.emojiOverride,
    })
  })

  return {
    configName: config.configName,
    effectiveFrom: config.effectiveFrom,
    effectiveTo: config.effectiveTo,
    dailyIncomeThreshold: config.dailyIncomeThreshold,
    earnedIncomeDeduction: config.earnedIncomeDeduction,
    smallTaxExemptionThreshold: config.smallTaxExemptionThreshold,
    useYn: config.useYn,
    wageItems,
    paymentItems,
    deductionItems,
  }
}

export function configToUpdateRequest(
  config: SettlementConfigResponse
): SettlementConfigUpdateRequest {
  return {
    configName: config.configName,
    effectiveFrom: config.effectiveFrom,
    effectiveTo: config.effectiveTo,
    dailyIncomeThreshold: config.dailyIncomeThreshold,
    earnedIncomeDeduction: config.earnedIncomeDeduction,
    smallTaxExemptionThreshold: config.smallTaxExemptionThreshold,
    useYn: config.useYn,
    wageItems: (config.wageItems ?? []).map(wage =>
      wageItemToUpsert(wage, mapWageItemToSettingDetail(wage), {
        title: wage.name ?? '',
        description: wage.description ?? '',
        emojiOverride: wage.emojiOverride,
      })
    ),
    paymentItems: (config.paymentItems ?? []).map(payment =>
      paymentItemToUpsert(payment, mapPaymentItemToSettingDetail(payment), {
        title: payment.itemName ?? '',
        description: payment.description ?? '',
        emojiOverride: payment.emojiOverride,
      })
    ),
    deductionItems: (config.deductionItems ?? []).map(deduction =>
      deductionItemToUpsert(deduction, mapDeductionItemToSettingDetail(deduction), {
        title: deduction.itemName ?? '',
        description: deduction.description ?? '',
        emojiOverride: deduction.emojiOverride,
      })
    ),
  }
}
