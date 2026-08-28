import {
  getCatalogSettlementItemSettingDetailByPaymentType,
  getCatalogSettlementItemSettingDetailByWageType,
  getCatalogSettlementItemSettingDetailForDeduction,
  parseEditableLines,
  type SettlementItemSettingDetail,
} from '@/data/mock/settlement-item-setting-detail.mock'
import type {
  DeductionItemResponse,
  PaymentItemResponse,
  WageItemResponse,
} from '@/shared/api/generated/settlement/schemas'

function asRecord(value: unknown): Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function parseDetailJson(raw: unknown): Record<string, unknown> {
  if (raw == null) return {}
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw as Record<string, unknown>
  if (typeof raw !== 'string' || !raw.trim()) return {}
  try {
    const parsed: unknown = JSON.parse(raw)
    return asRecord(parsed)
  } catch {
    return {}
  }
}

function readStringArray(value: unknown): string[] {
  if (typeof value === 'string' && value.trim()) {
    return parseEditableLines(value)
  }
  if (!Array.isArray(value)) return []
  return value.filter((line): line is string => typeof line === 'string' && line.trim().length > 0)
}

function firstLines(...values: unknown[]): string[] {
  for (const value of values) {
    const lines = readStringArray(value)
    if (lines.length > 0) return lines
  }
  return []
}

function readNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const n = Number(value.replace(/,/g, ''))
    return Number.isFinite(n) ? n : null
  }
  return null
}

function firstNumber(...values: unknown[]): number | null {
  for (const value of values) {
    const n = readNumber(value)
    if (n != null) return n
  }
  return null
}

function readEvidenceSubmission(
  value: unknown
): SettlementItemSettingDetail['evidenceSubmission'] {
  return value === 'required' || value === 'not_required' ? value : undefined
}

function readTransportMode(
  value: unknown
): SettlementItemSettingDetail['transportCommuteMode'] {
  if (value === 'private_car' || value === 'public_transit' || value === 'user_choice') {
    return value
  }
  return undefined
}

function normalizeLayout(layout: string | undefined): SettlementItemSettingDetail['layout'] {
  const normalized = layout?.trim()
  if (!normalized) return 'simple'
  if (normalized === 'volunteerActivity') return 'meal'
  return normalized as SettlementItemSettingDetail['layout']
}

function fillEmptyFromCatalog(
  mapped: SettlementItemSettingDetail,
  catalog: SettlementItemSettingDetail
): SettlementItemSettingDetail {
  return {
    ...catalog,
    ...mapped,
    layout: mapped.layout === 'simple' ? catalog.layout : mapped.layout,
    qualificationLines:
      mapped.qualificationLines.length > 0 ? mapped.qualificationLines : catalog.qualificationLines,
    remarkLines: mapped.remarkLines.length > 0 ? mapped.remarkLines : catalog.remarkLines,
    maxLimitWon: mapped.maxLimitWon ?? catalog.maxLimitWon,
    basicFeeWon: mapped.basicFeeWon ?? catalog.basicFeeWon,
    longDistanceFeeWon: mapped.longDistanceFeeWon ?? catalog.longDistanceFeeWon,
    transportCommuteMode: mapped.transportCommuteMode ?? catalog.transportCommuteMode,
    evidenceSubmission: mapped.evidenceSubmission ?? catalog.evidenceSubmission,
    geminiSession1Won: mapped.geminiSession1Won ?? catalog.geminiSession1Won,
    geminiSession2Won: mapped.geminiSession2Won ?? catalog.geminiSession2Won,
    geminiSession3Won: mapped.geminiSession3Won ?? catalog.geminiSession3Won,
    geminiSession4Won: mapped.geminiSession4Won ?? catalog.geminiSession4Won,
    withholdingExclusionMaxWon:
      mapped.withholdingExclusionMaxWon ?? catalog.withholdingExclusionMaxWon,
    withholdingEarnedIncomeDeductionWon:
      mapped.withholdingEarnedIncomeDeductionWon ?? catalog.withholdingEarnedIncomeDeductionWon,
    withholdingTaxRateBusiness:
      mapped.withholdingTaxRateBusiness ?? catalog.withholdingTaxRateBusiness,
    withholdingTaxRateOther: mapped.withholdingTaxRateOther ?? catalog.withholdingTaxRateOther,
    withholdingTaxRatePrize: mapped.withholdingTaxRatePrize ?? catalog.withholdingTaxRatePrize,
    withholdingTaxRateInterview:
      mapped.withholdingTaxRateInterview ?? catalog.withholdingTaxRateInterview,
  }
}

function geminiSessionsFromWageItem(
  item: WageItemResponse,
  detail: Record<string, unknown>
): Pick<
  SettlementItemSettingDetail,
  'geminiSession1Won' | 'geminiSession2Won' | 'geminiSession3Won' | 'geminiSession4Won'
> {
  const fromJson = {
    geminiSession1Won: readNumber(detail.session1Won),
    geminiSession2Won: readNumber(detail.session2Won),
    geminiSession3Won: readNumber(detail.session3Won),
    geminiSession4Won: readNumber(detail.session4Won),
  }

  const rateByUnit = new Map(
    (item.rateItems ?? []).map(rate => [rate.unitCount ?? 0, rate.amount ?? 0])
  )

  return {
    geminiSession1Won:
      fromJson.geminiSession1Won ?? (rateByUnit.has(1) ? rateByUnit.get(1)! : null),
    geminiSession2Won:
      fromJson.geminiSession2Won ?? (rateByUnit.has(2) ? rateByUnit.get(2)! : null),
    geminiSession3Won:
      fromJson.geminiSession3Won ?? (rateByUnit.has(3) ? rateByUnit.get(3)! : null),
    geminiSession4Won:
      fromJson.geminiSession4Won ?? (rateByUnit.has(4) ? rateByUnit.get(4)! : null),
  }
}

export function mapWageItemToSettingDetail(item: WageItemResponse): SettlementItemSettingDetail {
  const extra = asRecord(item)
  const detail = parseDetailJson(item.detailJson ?? extra.detail_json)
  const layout = normalizeLayout(item.layout ?? (extra.layout as string | undefined))
  const compareKind =
    detail.compareKind === 'exceed' || detail.compareKind === 'below'
      ? detail.compareKind
      : 'standard'

  const amount = readNumber(item.amount)
  const maxLimitWon =
    firstNumber(item.maxLimitWon, extra.max_limit_won, detail.maxLimitWon, detail.max_limit_won) ??
    (amount != null && amount > 0 ? amount : null)

  const basisHours =
    firstNumber(item.basisHours, extra.basis_hours, detail.basisHours) ??
    (layout === 'transport' ? readNumber(detail.minDistanceKm ?? detail.minOneWayKm) : null) ??
    1

  const mapped: SettlementItemSettingDetail = {
    layout,
    basisUnit: item.calculationUnit?.trim() || (extra.calculation_unit as string | undefined)?.trim() || '전체',
    basisHours,
    compareKind,
    maxLimitWon,
    basicFeeWon: readNumber(detail.basicFeeWon),
    longDistanceFeeWon: readNumber(detail.longDistanceFeeWon),
    qualificationLines: firstLines(
      item.qualificationLines,
      extra.qualification_lines,
      detail.qualificationLines,
      detail.qualification_lines
    ),
    remarkLines: firstLines(
      item.remarkLines,
      extra.remark_lines,
      detail.remarkLines,
      detail.remark_lines
    ),
    ...geminiSessionsFromWageItem(item, detail),
  }

  return fillEmptyFromCatalog(
    mapped,
    getCatalogSettlementItemSettingDetailByWageType(item.wageItemType)
  )
}

export function mapPaymentItemToSettingDetail(item: PaymentItemResponse): SettlementItemSettingDetail {
  const extra = asRecord(item)
  const detail = parseDetailJson(item.detailJson ?? extra.detail_json)
  const layout = normalizeLayout(item.layout ?? (extra.layout as string | undefined))
  const qualificationLines = firstLines(
    extra.qualificationLines,
    extra.qualification_lines,
    detail.qualificationLines,
    detail.qualification_lines
  )
  const remarkLines = firstLines(
    extra.remarkLines,
    extra.remark_lines,
    detail.remarkLines,
    detail.remark_lines
  )

  const minKm = readNumber(detail.minDistanceKm ?? detail.minOneWayKm)

  const mapped: SettlementItemSettingDetail = {
    layout,
    basisUnit: layout === 'transport' ? '거리' : layout === 'lodging' ? '일' : '시간',
    basisHours: layout === 'transport' ? (minKm ?? 30) : 1,
    compareKind: 'standard',
    maxLimitWon: firstNumber(item.maxLimitWon, item.maxAmount, extra.max_limit_won, detail.maxLimitWon),
    basicFeeWon: null,
    longDistanceFeeWon: null,
    qualificationLines:
      item.paymentItemType === 'ACTIVITY' && qualificationLines.length === 0
        ? ['참여자에게 지급되는 지원비']
        : qualificationLines,
    remarkLines,
    transportCommuteMode: readTransportMode(
      detail.transportCommuteMode ?? extra.transportCommuteMode
    ),
    evidenceSubmission: readEvidenceSubmission(
      detail.evidenceSubmission ?? extra.evidenceSubmission
    ),
  }

  return fillEmptyFromCatalog(
    mapped,
    getCatalogSettlementItemSettingDetailByPaymentType(item.paymentItemType)
  )
}

export function mapDeductionItemToSettingDetail(
  item: DeductionItemResponse
): SettlementItemSettingDetail {
  const extra = asRecord(item)
  const detail = parseDetailJson(item.detailJson ?? extra.detail_json)

  const mapped: SettlementItemSettingDetail = {
    layout:
      normalizeLayout(item.layout) === 'withholdingDailyWorker'
        ? 'withholdingDailyWorker'
        : 'withholdingDailyWorker',
    basisUnit: '전체',
    basisHours: 1,
    compareKind: 'standard',
    maxLimitWon: null,
    basicFeeWon: null,
    longDistanceFeeWon: null,
    qualificationLines: firstLines(
      extra.qualificationLines,
      extra.qualification_lines,
      detail.qualificationLines,
      detail.qualification_lines
    ),
    remarkLines: firstLines(extra.remarkLines, extra.remark_lines, detail.remarkLines, detail.remark_lines),
    withholdingExclusionMaxWon: readNumber(detail.withholdingExclusionMaxWon),
    withholdingEarnedIncomeDeductionWon: readNumber(detail.withholdingEarnedIncomeDeductionWon),
    withholdingTaxRateBusiness: readNumber(detail.withholdingTaxRateBusiness),
    withholdingTaxRateOther: readNumber(detail.withholdingTaxRateOther),
    withholdingTaxRatePrize: readNumber(detail.withholdingTaxRatePrize),
    withholdingTaxRateInterview: readNumber(detail.withholdingTaxRateInterview),
  }

  return fillEmptyFromCatalog(mapped, getCatalogSettlementItemSettingDetailForDeduction())
}
