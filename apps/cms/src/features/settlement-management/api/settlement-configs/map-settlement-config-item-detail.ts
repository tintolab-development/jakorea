import {
  getCatalogSettlementItemSettingDetailByPaymentType,
  getCatalogSettlementItemSettingDetailByWageType,
  getCatalogSettlementItemSettingDetailForDeduction,
  parseEditableLines,
  sanitizeSettlementConfigLines,
  type SettlementItemSettingDetail,
} from '@/features/settlement-management/model/settlement-item-setting-detail'
import type {
  DeductionItemResponse,
  PaymentItemResponse,
  SettlementConfigResponse,
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
  return sanitizeSettlementConfigLines(
    value.filter((line): line is string => typeof line === 'string')
  )
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

function readOptionalNumber(record: Record<string, unknown>, key: string): number | null | undefined {
  if (!Object.prototype.hasOwnProperty.call(record, key)) return undefined
  return readNumber(record[key])
}

function firstNumber(...values: unknown[]): number | null {
  for (const value of values) {
    const n = readNumber(value)
    if (n != null) return n
  }
  return null
}

export function evidenceSubmissionFromRequiredYn(
  value: boolean | null | undefined
): SettlementItemSettingDetail['evidenceSubmission'] {
  if (value === true) return 'required'
  if (value === false) return 'not_required'
  return undefined
}

export function evidenceRequiredYnFromSubmission(
  value: SettlementItemSettingDetail['evidenceSubmission']
): boolean | null {
  if (value === 'required') return true
  if (value === 'not_required') return false
  return null
}

function readTransportMode(value: unknown): SettlementItemSettingDetail['transportCommuteMode'] {
  // BE seed: private_car | public_transit only (user_choice는 FE opaque, 읽지 않음)
  if (value === 'private_car' || value === 'public_transit') {
    return value
  }
  return undefined
}

function normalizeLayout(layout: string | undefined): SettlementItemSettingDetail['layout'] {
  const normalized = layout?.trim()
  if (!normalized) return 'simple'
  // legacy wire alias → BE canonical `activity`
  if (normalized === 'volunteerActivity') return 'activity'
  return normalized as SettlementItemSettingDetail['layout']
}

function preferCatalogLayout(
  mappedLayout: SettlementItemSettingDetail['layout'],
  catalogLayout: SettlementItemSettingDetail['layout']
): SettlementItemSettingDetail['layout'] {
  // ACTIVITY: meal 등 잘못된 layout → catalog `activity` (wire에 volunteerActivity 강제 금지)
  if (catalogLayout === 'activity' && mappedLayout !== 'activity') {
    return catalogLayout
  }
  if (mappedLayout === 'simple') return catalogLayout
  return mappedLayout
}

function fillEmptyFromCatalog(
  mapped: SettlementItemSettingDetail,
  catalog: SettlementItemSettingDetail
): SettlementItemSettingDetail {
  return {
    ...catalog,
    ...mapped,
    layout: preferCatalogLayout(mapped.layout, catalog.layout),
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
    geminiSession1UniversityWon:
      mapped.geminiSession1UniversityWon ?? catalog.geminiSession1UniversityWon,
    geminiSession2UniversityWon:
      mapped.geminiSession2UniversityWon ?? catalog.geminiSession2UniversityWon,
    geminiSession3UniversityWon:
      mapped.geminiSession3UniversityWon ?? catalog.geminiSession3UniversityWon,
    geminiSession4UniversityWon:
      mapped.geminiSession4UniversityWon ?? catalog.geminiSession4UniversityWon,
    withholdingExclusionMaxWon:
      mapped.withholdingExclusionMaxWon === undefined
        ? catalog.withholdingExclusionMaxWon
        : mapped.withholdingExclusionMaxWon,
    withholdingEarnedIncomeDeductionWon:
      mapped.withholdingEarnedIncomeDeductionWon === undefined
        ? catalog.withholdingEarnedIncomeDeductionWon
        : mapped.withholdingEarnedIncomeDeductionWon,
    withholdingTaxRateBusiness:
      mapped.withholdingTaxRateBusiness === undefined
        ? catalog.withholdingTaxRateBusiness
        : mapped.withholdingTaxRateBusiness,
    withholdingTaxRateOther:
      mapped.withholdingTaxRateOther === undefined
        ? catalog.withholdingTaxRateOther
        : mapped.withholdingTaxRateOther,
    withholdingTaxRatePrize:
      mapped.withholdingTaxRatePrize === undefined
        ? catalog.withholdingTaxRatePrize
        : mapped.withholdingTaxRatePrize,
    withholdingTaxRateInterview:
      mapped.withholdingTaxRateInterview === undefined
        ? catalog.withholdingTaxRateInterview
        : mapped.withholdingTaxRateInterview,
    // DEPRECATED: withholdingTaxRateDailyWorker / withholdingEarnedIncomeTaxCreditRate — 업서트·카탈로그 채움 안 함
  }
}

function geminiSessionsFromWageItem(
  item: WageItemResponse,
  detail: Record<string, unknown>
): Pick<
  SettlementItemSettingDetail,
  | 'geminiSession1Won'
  | 'geminiSession2Won'
  | 'geminiSession3Won'
  | 'geminiSession4Won'
  | 'geminiSession1UniversityWon'
  | 'geminiSession2UniversityWon'
  | 'geminiSession3UniversityWon'
  | 'geminiSession4UniversityWon'
> {
  const fromJson = {
    geminiSession1Won: readNumber(detail.session1Won),
    geminiSession2Won: readNumber(detail.session2Won),
    geminiSession3Won: readNumber(detail.session3Won),
    geminiSession4Won: readNumber(detail.session4Won),
    geminiSession1UniversityWon: readNumber(
      detail.session1UniversityWon ?? detail.session1CollegeWon
    ),
    geminiSession2UniversityWon: readNumber(
      detail.session2UniversityWon ?? detail.session2CollegeWon
    ),
    geminiSession3UniversityWon: readNumber(
      detail.session3UniversityWon ?? detail.session3CollegeWon
    ),
    geminiSession4UniversityWon: readNumber(
      detail.session4UniversityWon ?? detail.session4CollegeWon
    ),
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
    geminiSession1UniversityWon: fromJson.geminiSession1UniversityWon,
    geminiSession2UniversityWon: fromJson.geminiSession2UniversityWon,
    geminiSession3UniversityWon: fromJson.geminiSession3UniversityWon,
    geminiSession4UniversityWon: fromJson.geminiSession4UniversityWon,
  }
}

export function mapWageItemToSettingDetail(item: WageItemResponse): SettlementItemSettingDetail {
  const extra = asRecord(item)
  const detail = parseDetailJson(item.detailJson ?? extra.detail_json)
  const catalog = getCatalogSettlementItemSettingDetailByWageType(item.wageItemType)
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
    (layout === 'transport' ? readNumber(detail.minOneWayKm ?? detail.minDistanceKm) : null) ??
    1

  const mapped: SettlementItemSettingDetail = {
    layout,
    basisUnit:
      item.calculationUnit?.trim() ||
      (extra.calculation_unit as string | undefined)?.trim() ||
      catalog.basisUnit ||
      '전체',
    basisHours,
    compareKind,
    maxLimitWon,
    basicFeeWon: readNumber(detail.basicFeeWon),
    longDistanceFeeWon: readNumber(detail.longDistanceFeeWon),
    // 임금: detailJson.qualificationLines / remarkLines 가 있으면 그대로 (카탈로그·top-level보다 우선)
    qualificationLines: firstLines(
      detail.qualificationLines,
      detail.qualification_lines,
      item.qualificationLines,
      extra.qualification_lines
    ),
    remarkLines: firstLines(
      detail.remarkLines,
      detail.remark_lines,
      item.remarkLines,
      extra.remark_lines
    ),
    ...geminiSessionsFromWageItem(item, detail),
  }

  return fillEmptyFromCatalog(mapped, catalog)
}


export function mapPaymentItemToSettingDetail(
  item: PaymentItemResponse
): SettlementItemSettingDetail {
  const extra = asRecord(item)
  const detail = parseDetailJson(item.detailJson ?? extra.detail_json)
  const layout = normalizeLayout(item.layout ?? (extra.layout as string | undefined))
  // 지급: top-level 없음 — detailJson.qualificationLines / remarkLines 만
  const qualificationLines = firstLines(detail.qualificationLines, detail.qualification_lines)
  const remarkLines = firstLines(detail.remarkLines, detail.remark_lines)

  // 거리 canonical: minOneWayKm → minDistanceKm → 30
  const minKm = readNumber(detail.minOneWayKm ?? detail.minDistanceKm)

  const mapped: SettlementItemSettingDetail = {
    layout,
    basisUnit: layout === 'transport' ? '거리' : layout === 'lodging' ? '박' : '시간',
    basisHours:
      layout === 'transport'
        ? (minKm ?? 30)
        : layout === 'lodging'
          ? (readNumber(detail.basisHours) ?? 1)
          : 1,
    compareKind: 'standard',
    // LODGING_1C1S: fixedAmountWon이 정본(시드). maxLimitWon/maxAmount는 fallback.
    maxLimitWon: firstNumber(
      detail.fixedAmountWon,
      item.maxLimitWon,
      item.maxAmount,
      extra.max_limit_won,
      detail.maxLimitWon
    ),
    basicFeeWon: null,
    longDistanceFeeWon: null,
    qualificationLines,
    remarkLines,
    transportCommuteMode: readTransportMode(
      detail.transportCommuteMode ?? extra.transportCommuteMode
    ),
    evidenceSubmission: evidenceSubmissionFromRequiredYn(
      item.evidenceRequiredYn === true ? true : item.evidenceRequiredYn === false ? false : null
    ),
  }

  const filled = fillEmptyFromCatalog(
    mapped,
    getCatalogSettlementItemSettingDetailByPaymentType(item.paymentItemType)
  )
  // evidenceRequiredYn이 있으면 mapped 값, 없으면 카탈로그(강사 교통=불필요 등) 유지
  return {
    ...filled,
    evidenceSubmission:
      mapped.evidenceSubmission !== undefined
        ? mapped.evidenceSubmission
        : filled.evidenceSubmission,
  }
}

export function mapDeductionItemToSettingDetail(
  item: DeductionItemResponse,
  config?: Pick<SettlementConfigResponse, 'earnedIncomeDeduction' | 'smallTaxExemptionThreshold'>
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
    // 공제: top-level 없음 — detailJson.qualificationLines / remarkLines 만
    qualificationLines: firstLines(detail.qualificationLines, detail.qualification_lines),
    remarkLines: firstLines(detail.remarkLines, detail.remark_lines),
    withholdingExclusionMaxWon: readOptionalNumber(detail, 'withholdingExclusionMaxWon'),
    withholdingEarnedIncomeDeductionWon: readOptionalNumber(
      detail,
      'withholdingEarnedIncomeDeductionWon'
    ),
    withholdingTaxRateBusiness: readOptionalNumber(detail, 'withholdingTaxRateBusiness'),
    withholdingTaxRateOther: readOptionalNumber(detail, 'withholdingTaxRateOther'),
    withholdingTaxRatePrize: readOptionalNumber(detail, 'withholdingTaxRatePrize'),
    withholdingTaxRateInterview: readOptionalNumber(detail, 'withholdingTaxRateInterview'),
  }

  const catalog = getCatalogSettlementItemSettingDetailForDeduction()
  return fillEmptyFromCatalog(mapped, {
    ...catalog,
    withholdingExclusionMaxWon:
      config?.smallTaxExemptionThreshold ?? catalog.withholdingExclusionMaxWon,
    withholdingEarnedIncomeDeductionWon:
      config?.earnedIncomeDeduction ?? catalog.withholdingEarnedIncomeDeductionWon,
  })
}
