import type { PaymentOrderCalculationLineKind } from '@/data/mock/payment-order-admin-list'
import {
  isSupportedBasisDetailLayout,
  type PaymentOrderCalculationBasisDetail,
} from '@/features/settlement/ui/payment-record/payment-order-calculation-basis-detail'
import type { SettlementFrontendCalculationDetailResponse } from '@/shared/api/generated/settlement/schemas'

import type { SettlementFrontendItemResponse } from '@/shared/api/generated/settlement/schemas'

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
  const rank = new Map(
    SETTLEMENT_FRONTEND_ITEM_TYPE_ORDER.map((type, index) => [type, index])
  )
  return [...items].sort((a, b) => {
    const aType = a.type ?? ''
    const bType = b.type ?? ''
    const aRank = rank.get(aType as (typeof SETTLEMENT_FRONTEND_ITEM_TYPE_ORDER)[number]) ??
      SETTLEMENT_FRONTEND_ITEM_TYPE_ORDER.length
    const bRank = rank.get(bType as (typeof SETTLEMENT_FRONTEND_ITEM_TYPE_ORDER)[number]) ??
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
  return `${amount.toLocaleString('ko-KR')}원`
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
  const period = input.period?.trim()
  if (period) return period
  if (input.businessPeriodStart && input.businessPeriodEnd) {
    return `${input.formatDate(input.businessPeriodStart)} ~ ${input.formatDate(input.businessPeriodEnd)}`
  }
  return '-'
}

export function formatLectureFeeStandardTitle(title?: string): string {
  const trimmed = title?.trim()
  return trimmed || '-'
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

function hasTypedBasisDetailFields(value: unknown): boolean {
  if (!isRecord(value)) return false
  switch (value.layout) {
    case 'lectureFeeTier':
      return 'tier' in value && 'totalWon' in value
    case 'lectureFeeSpecial':
      return 'feeAssessmentWon' in value && 'totalWon' in value
    case 'lectureFeeGemini':
      return 'feeAssessmentWon' in value && 'lectureTimeDisplay' in value
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

export function mapCalculationDetailToBasisDetail(
  detail?: SettlementFrontendCalculationDetailResponse | null
): PaymentOrderCalculationBasisDetail | undefined {
  if (!detail) return undefined

  const candidates: unknown[] = []
  if (detail.basisJson?.trim()) {
    try {
      candidates.push(JSON.parse(detail.basisJson) as unknown)
    } catch {
      // invalid JSON — try the object itself
    }
  }
  candidates.push(detail)

  for (const candidate of candidates) {
    if (
      isSupportedBasisDetailLayout(candidate as PaymentOrderCalculationBasisDetail) &&
      hasTypedBasisDetailFields(candidate)
    ) {
      return candidate as PaymentOrderCalculationBasisDetail
    }
  }

  return undefined
}
