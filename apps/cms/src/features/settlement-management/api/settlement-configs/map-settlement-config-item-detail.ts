import type { SettlementItemSettingDetail } from '@/data/mock/settlement-item-setting-detail.mock'
import type {
  DeductionItemResponse,
  PaymentItemResponse,
  WageItemResponse,
} from '@/shared/api/generated/settlement/schemas'

function parseDetailJson(raw: string | undefined): Record<string, unknown> {
  if (!raw?.trim()) return {}
  try {
    const parsed: unknown = JSON.parse(raw)
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {}
  } catch {
    return {}
  }
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((line): line is string => typeof line === 'string')
}

function readNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
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
  if (value === 'private_car' || value === 'public_transit') return value
  return undefined
}

function normalizeLayout(layout: string | undefined): SettlementItemSettingDetail['layout'] {
  const normalized = layout?.trim()
  if (!normalized) return 'simple'
  if (normalized === 'volunteerActivity') return 'meal'
  return normalized as SettlementItemSettingDetail['layout']
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
  const detail = parseDetailJson(item.detailJson)
  const layout = normalizeLayout(item.layout)
  const compareKind =
    detail.compareKind === 'exceed' || detail.compareKind === 'below'
      ? detail.compareKind
      : 'standard'

  const basisHours =
    item.basisHours ??
    (layout === 'transport' ? readNumber(detail.minDistanceKm ?? detail.minOneWayKm) : null) ??
    1

  return {
    layout,
    basisUnit: item.calculationUnit?.trim() || '전체',
    basisHours,
    compareKind,
    maxLimitWon: item.maxLimitWon ?? null,
    basicFeeWon: readNumber(detail.basicFeeWon),
    longDistanceFeeWon: readNumber(detail.longDistanceFeeWon),
    qualificationLines: item.qualificationLines ?? [],
    remarkLines: item.remarkLines ?? [],
    ...geminiSessionsFromWageItem(item, detail),
  }
}

export function mapPaymentItemToSettingDetail(item: PaymentItemResponse): SettlementItemSettingDetail {
  const detail = parseDetailJson(item.detailJson)
  const layout = normalizeLayout(item.layout)
  const qualificationLines =
    item.paymentItemType === 'ACTIVITY' && readStringArray(detail.qualificationLines).length === 0
      ? ['참여자에게 지급되는 지원비']
      : readStringArray(detail.qualificationLines)

  const minKm = readNumber(detail.minDistanceKm ?? detail.minOneWayKm)

  return {
    layout,
    basisUnit: layout === 'transport' ? '거리' : layout === 'lodging' ? '일' : '시간',
    basisHours: layout === 'transport' ? (minKm ?? 30) : 1,
    compareKind: 'standard',
    maxLimitWon: item.maxLimitWon ?? item.maxAmount ?? null,
    basicFeeWon: null,
    longDistanceFeeWon: null,
    qualificationLines,
    remarkLines: readStringArray(detail.remarkLines),
    transportCommuteMode: readTransportMode(detail.transportCommuteMode),
    evidenceSubmission: readEvidenceSubmission(detail.evidenceSubmission),
  }
}

export function mapDeductionItemToSettingDetail(
  item: DeductionItemResponse
): SettlementItemSettingDetail {
  const detail = parseDetailJson(item.detailJson)

  return {
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
    qualificationLines: readStringArray(detail.qualificationLines),
    remarkLines: readStringArray(detail.remarkLines),
    withholdingExclusionMaxWon: readNumber(detail.withholdingExclusionMaxWon),
    withholdingEarnedIncomeDeductionWon: readNumber(detail.withholdingEarnedIncomeDeductionWon),
    withholdingTaxRateBusiness: readNumber(detail.withholdingTaxRateBusiness),
    withholdingTaxRateOther: readNumber(detail.withholdingTaxRateOther),
    withholdingTaxRatePrize: readNumber(detail.withholdingTaxRatePrize),
    withholdingTaxRateInterview: readNumber(detail.withholdingTaxRateInterview),
  }
}
