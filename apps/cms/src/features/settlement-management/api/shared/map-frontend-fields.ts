import type { PaymentOrderCalculationLineKind } from '@/features/settlement-management/model/payment-order-admin-list'
import {
  isGenericLectureFeeCategoryLabel,
  isSupportedBasisDetailLayout,
  lectureFeeTitleFromGradeOrWage,
  mapLectureFeeCalculationDetailToBasisDetail,
  mapTransportationCalculationDetailToBasisDetail,
  resolveLectureTimeDisplayFromCalculationFields,
  type PaymentOrderCalculationBasisDetail,
} from '@/features/settlement/ui/payment-record/payment-order-calculation-basis-detail'
import type { SettlementFrontendCalculationDetailResponse } from '@/shared/api/generated/settlement/schemas'

import type { SettlementFrontendItemResponse } from '@/shared/api/generated/settlement/schemas'
import { formatNumberDisplay } from '@/shared/utils'

/** 지급조서 items[] 노출 순서 — BE v2 SSOT */
const SETTLEMENT_FRONTEND_ITEM_TYPE_ORDER = [
  'instructor_fee',
  'transportation',
  'accommodation',
  'activity',
  'meal',
  'withholding',
  'other',
] as const

export function sortSettlementFrontendItems(
  items: SettlementFrontendItemResponse[]
): SettlementFrontendItemResponse[] {
  const rank = new Map(SETTLEMENT_FRONTEND_ITEM_TYPE_ORDER.map((type, index) => [type, index]))
  return [...items].sort((a, b) => {
    const aType = a.type ?? ''
    const bType = b.type ?? ''
    const aRank =
      rank.get(aType as (typeof SETTLEMENT_FRONTEND_ITEM_TYPE_ORDER)[number]) ??
      SETTLEMENT_FRONTEND_ITEM_TYPE_ORDER.length
    const bRank =
      rank.get(bType as (typeof SETTLEMENT_FRONTEND_ITEM_TYPE_ORDER)[number]) ??
      SETTLEMENT_FRONTEND_ITEM_TYPE_ORDER.length
    return aRank - bRank
  })
}

/** 편도 30km 미만 등 — 교통 0원 행 미노출 */
export function filterSettlementFrontendItemsForDisplay(
  items: SettlementFrontendItemResponse[]
): SettlementFrontendItemResponse[] {
  return items.filter(item => {
    const amount = item.amount ?? 0
    if (item.type === 'transportation' && amount === 0) return false
    return true
  })
}

export function prepareSettlementFrontendItemsForStatement(
  items: SettlementFrontendItemResponse[] | undefined
): SettlementFrontendItemResponse[] {
  return sortSettlementFrontendItems(filterSettlementFrontendItemsForDisplay(items ?? []))
}

export function formatLectureSessionLabel(sessionOrdinal?: number): string {
  if (sessionOrdinal == null) return '-'
  return `${sessionOrdinal}차시`
}

export function formatWonAmountDisplay(amount?: number | null): string {
  if (amount == null) return '-'
  return `${formatNumberDisplay(amount)}원`
}

export function parseSessionProgressDisplay(
  display?: string
): { sessionCompleted: number; sessionTotal: number } | null {
  if (!display) return null
  const match = display.trim().match(/^(\d+)\s*\/\s*(\d+)$/)
  if (!match) return null
  return { sessionCompleted: Number(match[1]), sessionTotal: Number(match[2]) }
}

export function formatProgramSessionProgressDisplay(input: {
  programSessionProgressDisplay?: string
  sessionCompleted?: number
  sessionTotal?: number
}): string {
  const display = input.programSessionProgressDisplay?.trim()
  if (display) return display
  if (input.sessionCompleted != null && input.sessionTotal != null) {
    return `${input.sessionCompleted} / ${input.sessionTotal}`
  }
  return '-'
}

export function pickProgramSessionProgressFromListItems(
  items: Array<{
    sessionCompleted?: number
    sessionTotal?: number
    programSessionProgressDisplay?: string
  }>
): { sessionCompleted: number; sessionTotal: number } | null {
  const withNumbers = items.find(i => i.sessionCompleted != null && i.sessionTotal != null)
  if (withNumbers?.sessionCompleted != null && withNumbers.sessionTotal != null) {
    return {
      sessionCompleted: withNumbers.sessionCompleted,
      sessionTotal: withNumbers.sessionTotal,
    }
  }
  for (const item of items) {
    const parsed = parseSessionProgressDisplay(item.programSessionProgressDisplay)
    if (parsed) return parsed
  }
  return null
}

export function pickBusinessPeriodFromListItems(
  items: Array<{
    businessPeriodStart?: string
    businessPeriodEnd?: string
    lectureDate?: string
  }>
): { businessPeriodStart: string; businessPeriodEnd: string } {
  const withPeriod = items.find(i => i.businessPeriodStart && i.businessPeriodEnd)
  if (withPeriod?.businessPeriodStart && withPeriod.businessPeriodEnd) {
    return {
      businessPeriodStart: withPeriod.businessPeriodStart,
      businessPeriodEnd: withPeriod.businessPeriodEnd,
    }
  }
  const dates = items
    .map(i => i.lectureDate)
    .filter((d): d is string => Boolean(d))
    .sort()
  return {
    businessPeriodStart: dates[0] ?? '',
    businessPeriodEnd: dates[dates.length - 1] ?? '',
  }
}

export function formatBusinessPeriodDisplay(input: {
  period?: string
  businessPeriodStart?: string
  businessPeriodEnd?: string
  formatDate: (iso: string) => string
}): string {
  // 사업 운영 기간 = businessPeriodStart/End. period(YYYY-MM 조회월)는 대체값이 아님.
  if (input.businessPeriodStart && input.businessPeriodEnd) {
    return `${input.formatDate(input.businessPeriodStart)} ~ ${input.formatDate(input.businessPeriodEnd)}`
  }
  return '-'
}

export function formatLectureFeeStandardTitle(title?: string): string {
  if (isGenericLectureFeeCategoryLabel(title)) return '-'
  return title?.trim() || '-'
}

export function resolveLectureFeeStandardTitleFromSettlement(input: {
  lectureFeeStandardTitle?: string | null
  feeGrade?: string | null
  wageItemType?: string | null
}): string {
  const fromTitle = formatLectureFeeStandardTitle(input.lectureFeeStandardTitle ?? undefined)
  if (fromTitle !== '-') return fromTitle
  return formatLectureFeeStandardTitle(
    lectureFeeTitleFromGradeOrWage(input.feeGrade, input.wageItemType)
  )
}

/** 책정 금액: lectureFeeStandardAmount 우선, 없으면 instructor_fee item amount */
export function resolveLectureFeeStandardAmountDisplay(
  standardAmount?: number | null,
  items?: Array<{ type?: string | null; amount?: number | null }>
): string {
  if (standardAmount != null) return formatWonAmountDisplay(standardAmount)
  const feeItem = items?.find(item => item.type === 'instructor_fee')
  if (feeItem?.amount != null) return formatWonAmountDisplay(feeItem.amount)
  return '-'
}

export function formatBusinessIncomeEarnerLabel(label?: string): string {
  const trimmed = label?.trim()
  return trimmed || '해당 없음'
}

export function needsPaymentStatementJoin(
  items: Array<{ settlementId?: number; statementId?: number }>
): boolean {
  return items.some(item => item.settlementId != null && item.statementId == null)
}

export function mapSettlementFrontendItemTypeToLineKind(
  type: string | undefined,
  amount: number
): PaymentOrderCalculationLineKind {
  const normalized = type?.trim()
  if (amount < 0 || normalized === 'withholding') return 'withholding'
  if (normalized === 'transportation') return 'travel'
  if (normalized === 'accommodation') return 'lodging'
  if (normalized === 'meal') return 'meal'
  if (normalized === 'activity') return 'activity'
  return 'lecture_fee'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function coerceTransportStudentBasisLayout(value: unknown): unknown {
  if (!isRecord(value) || value.layout !== 'transportStudent') return value
  if ('outbound' in value) return { ...value, layout: 'transportRoundTrip' }
  if ('trip' in value) return { ...value, layout: 'transportOneWay' }
  return { ...value, layout: 'transportOneWay' }
}

function hasLectureFeeAmountField(value: Record<string, unknown>): boolean {
  return (
    'feeAssessmentWon' in value ||
    'totalWon' in value ||
    'amount' in value ||
    'tier' in value
  )
}

function hasLectureFeeTimeField(value: Record<string, unknown>): boolean {
  return 'lectureTimeDisplay' in value || 'sessionOrdinal' in value || 'hours' in value
}

function hasTypedBasisDetailFields(value: unknown): boolean {
  if (!isRecord(value)) return false
  switch (value.layout) {
    case 'lectureFeeTier':
      // BE basisJson은 tier/totalWon 없이 feeGrade·feeAssessmentWon·sessionOrdinal만 올 수 있다.
      return hasLectureFeeAmountField(value)
    case 'lectureFeeSpecial':
      return hasLectureFeeAmountField(value)
    case 'lectureFeeGemini':
      return hasLectureFeeAmountField(value) && hasLectureFeeTimeField(value)
    case 'transportInstructor':
      return 'distanceKm' in value
    case 'transportRoundTrip':
      return 'outbound' in value
    case 'transportOneWay':
      return 'trip' in value
    case 'lodgingGeneral':
    case 'lodging1s1g':
      return 'lodgingFee' in value
    case 'meal':
      return 'mealFee' in value
    case 'activity':
      return 'activityFee' in value
    case 'withholding':
      return 'withholdingTaxAmountWon' in value
    default:
      return false
  }
}

function parseBasisJsonCandidate(basisJson: unknown): unknown | undefined {
  if (basisJson == null) return undefined
  if (typeof basisJson === 'object' && !Array.isArray(basisJson)) return basisJson
  if (typeof basisJson !== 'string' || !basisJson.trim()) return undefined
  try {
    const parsed: unknown = JSON.parse(basisJson)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed
  } catch {
    return undefined
  }
  return undefined
}

function nonEmptyStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
}

function mapRemoteCalculationDetail(
  detail: SettlementFrontendCalculationDetailResponse
): PaymentOrderCalculationBasisDetail | undefined {
  const title = detail.title?.trim()
  const formulaText = detail.formulaText?.trim()
  const lineLabels = nonEmptyStringArray(detail.lineLabels)
  const formulaLines = nonEmptyStringArray(detail.formulaLines)
  const summaryLabels = nonEmptyStringArray(detail.summaryLabels)

  if (
    !formulaText &&
    lineLabels.length === 0 &&
    formulaLines.length === 0 &&
    summaryLabels.length === 0 &&
    detail.resultAmount == null
  ) {
    return undefined
  }

  return {
    layout: 'remote',
    sourceLayout: detail.layout?.trim() || undefined,
    title: title || '산정 기준 상세',
    formulaText: formulaText || undefined,
    lineLabels,
    formulaLines,
    summaryLabels,
    resultAmount: detail.resultAmount,
    iconKey: detail.iconKey?.trim() || undefined,
    emojiOverride: detail.emojiOverride?.trim() || undefined,
  }
}

export function mapCalculationDetailToBasisDetail(
  detail?: SettlementFrontendCalculationDetailResponse | null
): PaymentOrderCalculationBasisDetail | undefined {
  if (!detail) return undefined

  const transportationSnapshot = mapTransportationCalculationDetailToBasisDetail(detail)
  if (transportationSnapshot) return transportationSnapshot

  const candidates: unknown[] = []
  const parsedBasisJson = parseBasisJsonCandidate(detail.basisJson)
  if (parsedBasisJson) candidates.push(parsedBasisJson)
  candidates.push(detail)

  for (const candidate of candidates) {
    const coerced = coerceTransportStudentBasisLayout(candidate)
    if (
      isSupportedBasisDetailLayout(coerced as PaymentOrderCalculationBasisDetail) &&
      hasTypedBasisDetailFields(coerced)
    ) {
      const normalized = normalizeTypedLectureFeeBasisDetail(
        coerced as PaymentOrderCalculationBasisDetail,
        candidate
      )
      // typed payload에 tier/totalWon이 없으면 mapLectureFee로 급수·특강·제미나이 필드를 채운다.
      if (
        normalized.layout === 'lectureFeeTier' ||
        normalized.layout === 'lectureFeeSpecial' ||
        normalized.layout === 'lectureFeeGemini'
      ) {
        const fromLectureFee = mapLectureFeeCalculationDetailToBasisDetail(detail)
        if (fromLectureFee) return fromLectureFee
      }
      return normalized
    }
  }

  const lectureFee = mapLectureFeeCalculationDetailToBasisDetail(detail)
  if (lectureFee) return lectureFee

  return mapRemoteCalculationDetail(detail)
}

/**
 * typed basisJson의 lectureTimeDisplay가 시계열·일정명이면 sessionOrdinal·hours로 정규화.
 * calculationDetail 밖(payment/settlement) ordinal은 쓰지 않는다.
 */
function normalizeTypedLectureFeeBasisDetail(
  detail: PaymentOrderCalculationBasisDetail,
  source: unknown
): PaymentOrderCalculationBasisDetail {
  if (
    detail.layout !== 'lectureFeeTier' &&
    detail.layout !== 'lectureFeeSpecial' &&
    detail.layout !== 'lectureFeeGemini'
  ) {
    return detail
  }

  const record = isRecord(source) ? source : undefined
  const sessionOrdinalRaw = record?.sessionOrdinal
  const sessionOrdinal =
    typeof sessionOrdinalRaw === 'number' && Number.isFinite(sessionOrdinalRaw)
      ? sessionOrdinalRaw
      : typeof sessionOrdinalRaw === 'string' && sessionOrdinalRaw.trim() !== ''
        ? Number(sessionOrdinalRaw)
        : undefined
  const hoursRaw = record?.hours
  const hours =
    typeof hoursRaw === 'number' && Number.isFinite(hoursRaw)
      ? hoursRaw
      : typeof hoursRaw === 'string' && hoursRaw.trim() !== ''
        ? Number(hoursRaw)
        : undefined
  const lectureTimeDisplay = resolveLectureTimeDisplayFromCalculationFields({
    lectureTimeDisplay: detail.lectureTimeDisplay,
    sessionOrdinal:
      sessionOrdinal != null && Number.isFinite(sessionOrdinal) ? sessionOrdinal : null,
    hours: hours != null && Number.isFinite(hours) ? hours : null,
  })
  if (lectureTimeDisplay === detail.lectureTimeDisplay) return detail
  return { ...detail, lectureTimeDisplay }
}
