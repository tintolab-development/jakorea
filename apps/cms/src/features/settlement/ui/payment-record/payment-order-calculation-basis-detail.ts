/**
 * 산출 내역서 — 산정 기준 상세 모달 payload (read-only viewer SSOT)
 */

import type { PaymentOrderCalculationStatementSessionBlock } from '@/data/mock/payment-order-admin-list'

export interface PaymentOrderCalculationBasisDetailLectureFeeTier {
  layout: 'lectureFeeTier'
  tier: '1' | '2' | '3'
  categoryLabel: string
  feeAssessmentWon: number
  lectureTimeDisplay: string
  totalWon: number
}

/** 특강 강사비 — 1~3급과 동일 표, 급수 없음 */
export interface PaymentOrderCalculationBasisDetailLectureFeeSpecial {
  layout: 'lectureFeeSpecial'
  categoryLabel: string
  feeAssessmentWon: number
  lectureTimeDisplay: string
  totalWon: number
}

export const SPECIAL_LECTURE_FEE_TITLE = '특강 강사비'
export const GEMINI_LECTURE_FEE_TITLE = '제미나이 강사비'

/** 제미나이 강사비 — 구분 · 강의 시간 · 강의비 책정 (합계 없음) */
export interface PaymentOrderCalculationBasisDetailLectureFeeGemini {
  layout: 'lectureFeeGemini'
  categoryLabel: string
  lectureTimeDisplay: string
  feeAssessmentWon: number
}

export interface PaymentOrderCalculationBasisDetailTransportPublicTransit {
  modeLabel: string
  amountWon: number
  receiptFileName?: string
  receiptUrl?: string
}

export interface PaymentOrderCalculationBasisDetailTransportTripLeg {
  categoryLabel: string
  publicTransit: PaymentOrderCalculationBasisDetailTransportPublicTransit
}

/** 학생 왕복 */
export interface PaymentOrderCalculationBasisDetailTransportRoundTrip {
  layout: 'transportRoundTrip'
  outbound: PaymentOrderCalculationBasisDetailTransportTripLeg
  inbound: PaymentOrderCalculationBasisDetailTransportTripLeg
  totalWon: number
}

/** 학생 편도 */
export interface PaymentOrderCalculationBasisDetailTransportOneWay {
  layout: 'transportOneWay'
  trip: PaymentOrderCalculationBasisDetailTransportTripLeg
}

/** 강사 교통비(1사1교) */
export interface PaymentOrderCalculationBasisDetailTransportInstructor {
  layout: 'transportInstructor'
  categoryLabel: string
  distanceKm: number
  fuelCostWon: number
  tollFeeWon: number
  totalWon: number
}

export interface PaymentOrderCalculationBasisDetailLodgingReceipt {
  amountWon: number
  receiptFileName?: string
  receiptUrl?: string
}

/** 1사1교 외 프로그램 공통 숙박비 */
export interface PaymentOrderCalculationBasisDetailLodgingGeneral {
  layout: 'lodgingGeneral'
  categoryLabel: string
  nightsDisplay: string
  lodgingFee: PaymentOrderCalculationBasisDetailLodgingReceipt
  totalWon: number
}

/** 1사1교 숙박비 */
export interface PaymentOrderCalculationBasisDetailLodging1s1g {
  layout: 'lodging1s1g'
  categoryLabel: string
  nightsDisplay: string
  lodgingFee: PaymentOrderCalculationBasisDetailLodgingReceipt
  totalWon: number
}

/** 식사비 */
export interface PaymentOrderCalculationBasisDetailMeal {
  layout: 'meal'
  categoryLabel: string
  mealFee: PaymentOrderCalculationBasisDetailLodgingReceipt
  totalWon: number
}

/** 자원봉사자 활동비 */
export interface PaymentOrderCalculationBasisDetailActivity {
  layout: 'activity'
  categoryLabel: string
  activityFee: PaymentOrderCalculationBasisDetailLodgingReceipt
  totalWon: number
}

/** 원천징수 */
export interface PaymentOrderCalculationBasisDetailWithholding {
  layout: 'withholding'
  dailySalaryTotalWon: number
  earnedIncomeDeductionWon: number
  incomeTaxRatePercent: number
  incomeTaxWon: number
  earnedIncomeTaxCreditWon: number
  withholdingTaxAmountWon: number
}

export type PaymentOrderCalculationBasisDetail =
  | PaymentOrderCalculationBasisDetailLectureFeeTier
  | PaymentOrderCalculationBasisDetailLectureFeeSpecial
  | PaymentOrderCalculationBasisDetailLectureFeeGemini
  | PaymentOrderCalculationBasisDetailTransportRoundTrip
  | PaymentOrderCalculationBasisDetailTransportOneWay
  | PaymentOrderCalculationBasisDetailTransportInstructor
  | PaymentOrderCalculationBasisDetailLodgingGeneral
  | PaymentOrderCalculationBasisDetailLodging1s1g
  | PaymentOrderCalculationBasisDetailMeal
  | PaymentOrderCalculationBasisDetailActivity
  | PaymentOrderCalculationBasisDetailWithholding

const LECTURE_FEE_TIER_TITLE_MAP: Record<string, PaymentOrderCalculationBasisDetailLectureFeeTier['tier']> =
  {
    '1급 강사비': '1',
    '2급 강사비': '2',
    '3급 강사비': '3',
  }

const DEFAULT_PARTICIPANT_TRANSIT: PaymentOrderCalculationBasisDetailTransportPublicTransit = {
  modeLabel: '기차(KTX·SRT·무궁화호 등)',
  amountWon: 25000,
  receiptFileName: '대중교통 이용 영수증.pdf',
}

function defaultParticipantTripLeg(): PaymentOrderCalculationBasisDetailTransportTripLeg {
  return {
    categoryLabel: '참여자 교통비',
    publicTransit: { ...DEFAULT_PARTICIPANT_TRANSIT },
  }
}

export function resolveBasisDetailModalTitle(detail: PaymentOrderCalculationBasisDetail): string {
  switch (detail.layout) {
    case 'lectureFeeTier':
    case 'lectureFeeGemini':
      return '강사비 산정 기준 상세'
    case 'lectureFeeSpecial':
      return '특강 강사비 산정 기준 상세'
    case 'transportRoundTrip':
    case 'transportOneWay':
    case 'transportInstructor':
      return '교통비 산정 기준 상세'
    case 'lodgingGeneral':
      return '숙박비 산정 기준 상세'
    case 'lodging1s1g':
      return '1사1교 숙박비 산정 기준 상세'
    case 'meal':
      return '식사비 산정 기준 상세'
    case 'activity':
      return '활동비 산정 기준 상세'
    case 'withholding':
      return '원천징수 산정 기준 상세'
    default:
      return '산정 기준 상세'
  }
}

export function isSupportedBasisDetailLayout(
  detail: PaymentOrderCalculationBasisDetail | undefined
): detail is PaymentOrderCalculationBasisDetail {
  if (!detail) return false
  return (
    detail.layout === 'lectureFeeTier' ||
    detail.layout === 'lectureFeeSpecial' ||
    detail.layout === 'lectureFeeGemini' ||
    detail.layout === 'transportRoundTrip' ||
    detail.layout === 'transportOneWay' ||
    detail.layout === 'transportInstructor' ||
    detail.layout === 'lodgingGeneral' ||
    detail.layout === 'lodging1s1g' ||
    detail.layout === 'meal' ||
    detail.layout === 'activity' ||
    detail.layout === 'withholding'
  )
}

export function resolveTravelBasisDetailTotalWon(
  detail: Extract<
    PaymentOrderCalculationBasisDetail,
    { layout: 'transportRoundTrip' | 'transportOneWay' | 'transportInstructor' }
  >
): number {
  switch (detail.layout) {
    case 'transportRoundTrip':
      return detail.totalWon
    case 'transportOneWay':
      return detail.trip.publicTransit.amountWon
    case 'transportInstructor':
      return detail.totalWon
    default:
      return 0
  }
}

/** mock·데모 — seed로 학생 왕복 / 학생 편도 / 강사(1사1교) 순환 */
export function buildTravelBasisDetail(
  seed: number
):
  | PaymentOrderCalculationBasisDetailTransportRoundTrip
  | PaymentOrderCalculationBasisDetailTransportOneWay
  | PaymentOrderCalculationBasisDetailTransportInstructor {
  const variant = seed % 3

  if (variant === 0) {
    const leg = defaultParticipantTripLeg()
    return {
      layout: 'transportRoundTrip',
      outbound: leg,
      inbound: {
        categoryLabel: leg.categoryLabel,
        publicTransit: { ...leg.publicTransit },
      },
      totalWon: leg.publicTransit.amountWon * 2,
    }
  }

  if (variant === 1) {
    return {
      layout: 'transportOneWay',
      trip: defaultParticipantTripLeg(),
    }
  }

  return {
    layout: 'transportInstructor',
    categoryLabel: '교통비(1사1교)',
    distanceKm: 36,
    fuelCostWon: 50000,
    tollFeeWon: 1000,
    totalWon: 51000,
  }
}

/** mock·데모 — seed 짝수: 일반 숙박비 / 홀수: 1사1교 숙박비 */
export function buildLodgingBasisDetail(
  seed: number
): PaymentOrderCalculationBasisDetailLodgingGeneral | PaymentOrderCalculationBasisDetailLodging1s1g {
  if (seed % 2 === 0) {
    const amountWon = 150000
    return {
      layout: 'lodgingGeneral',
      categoryLabel: '숙박비(일반)',
      nightsDisplay: '1일',
      lodgingFee: {
        amountWon,
        receiptFileName: '숙박비 영수증.pdf',
      },
      totalWon: amountWon,
    }
  }

  const amountWon = 80000
  return {
    layout: 'lodging1s1g',
    categoryLabel: '숙박비(1사1교)',
    nightsDisplay: '1일',
    lodgingFee: {
      amountWon,
      receiptFileName: '숙박비 영수증.pdf',
    },
    totalWon: amountWon,
  }
}

export function resolveLodgingBasisDetailTotalWon(
  detail: PaymentOrderCalculationBasisDetailLodgingGeneral | PaymentOrderCalculationBasisDetailLodging1s1g
): number {
  return detail.totalWon
}

/** mock·데모 — 식사비 (한도 3만원) */
export function buildMealBasisDetail(): PaymentOrderCalculationBasisDetailMeal {
  const amountWon = 30000
  return {
    layout: 'meal',
    categoryLabel: '식사비',
    mealFee: {
      amountWon,
      receiptFileName: '식사비 영수증.pdf',
    },
    totalWon: amountWon,
  }
}

export function resolveMealBasisDetailTotalWon(
  detail: PaymentOrderCalculationBasisDetailMeal
): number {
  return detail.totalWon
}

/** mock·데모 — 자원봉사자 활동비 (한도 5만원) */
export function buildActivityBasisDetail(): PaymentOrderCalculationBasisDetailActivity {
  const amountWon = 50000
  return {
    layout: 'activity',
    categoryLabel: '자원봉사자 활동비',
    activityFee: {
      amountWon,
      receiptFileName: '활동비 영수증.pdf',
    },
    totalWon: amountWon,
  }
}

export function resolveActivityBasisDetailTotalWon(
  detail: PaymentOrderCalculationBasisDetailActivity
): number {
  return detail.totalWon
}

/** mock·데모 — 1일 급여 총액 기준 원천징수 산정 (소득세 3.3% · 근로소득세액공제) */
export function buildWithholdingBasisDetail(
  dailySalaryTotalWon: number
): PaymentOrderCalculationBasisDetailWithholding {
  const earnedIncomeDeductionWon = Math.round(dailySalaryTotalWon * 0.5)
  const taxableWon = dailySalaryTotalWon - earnedIncomeDeductionWon
  const incomeTaxRatePercent = 3.3
  const incomeTaxWon = Math.round(taxableWon * (incomeTaxRatePercent / 100))
  const earnedIncomeTaxCreditWon = Math.round(incomeTaxWon * (2722 / 4950))
  const withholdingTaxAmountWon = incomeTaxWon - earnedIncomeTaxCreditWon

  return {
    layout: 'withholding',
    dailySalaryTotalWon,
    earnedIncomeDeductionWon,
    incomeTaxRatePercent,
    incomeTaxWon,
    earnedIncomeTaxCreditWon,
    withholdingTaxAmountWon,
  }
}

export function resolveWithholdingBasisDetailAmountWon(
  detail: PaymentOrderCalculationBasisDetailWithholding
): number {
  return -detail.withholdingTaxAmountWon
}

function resolveLectureFeeTier(
  lectureFeeStandardTitle: string
): PaymentOrderCalculationBasisDetailLectureFeeTier['tier'] {
  const mapped = LECTURE_FEE_TIER_TITLE_MAP[lectureFeeStandardTitle]
  if (mapped) return mapped
  if (lectureFeeStandardTitle.includes('1급')) return '1'
  if (lectureFeeStandardTitle.includes('3급')) return '3'
  return '2'
}

export function buildLectureFeeTierBasisDetail(
  lectureFeeStandardTitle: string,
  lectureFee: number,
  sessionStart: number
): PaymentOrderCalculationBasisDetailLectureFeeTier {
  const trimmed = lectureFeeStandardTitle.trim()
  const categoryLabel = isGenericLectureFeeCategoryLabel(trimmed) ? '2급 강사비' : trimmed
  return {
    layout: 'lectureFeeTier',
    tier: resolveLectureFeeTier(categoryLabel),
    categoryLabel,
    feeAssessmentWon: lectureFee,
    lectureTimeDisplay: `${sessionStart}차시`,
    totalWon: lectureFee,
  }
}

const GENERIC_LECTURE_FEE_LABELS = new Set(['강사비', '강의비', '—'])

export function isGenericLectureFeeCategoryLabel(title: string | undefined): boolean {
  const normalized = title?.trim()
  return !normalized || GENERIC_LECTURE_FEE_LABELS.has(normalized)
}

export function isSpecialLectureFeeTitle(title: string | undefined): boolean {
  return title?.trim() === SPECIAL_LECTURE_FEE_TITLE
}

export function isGeminiLectureFeeTitle(title: string | undefined): boolean {
  return title?.trim() === GEMINI_LECTURE_FEE_TITLE
}

export function buildLectureFeeGeminiBasisDetail(
  lectureFee: number,
  sessionStart: number
): PaymentOrderCalculationBasisDetailLectureFeeGemini {
  return {
    layout: 'lectureFeeGemini',
    categoryLabel: GEMINI_LECTURE_FEE_TITLE,
    lectureTimeDisplay: `${sessionStart}차시`,
    feeAssessmentWon: lectureFee,
  }
}

export function buildLectureFeeSpecialBasisDetail(
  lectureFee: number,
  sessionStart: number
): PaymentOrderCalculationBasisDetailLectureFeeSpecial {
  return {
    layout: 'lectureFeeSpecial',
    categoryLabel: SPECIAL_LECTURE_FEE_TITLE,
    feeAssessmentWon: lectureFee,
    lectureTimeDisplay: `${sessionStart}차시`,
    totalWon: lectureFee,
  }
}

export function buildLectureFeeBasisDetailFromStandardTitle(
  lectureFeeStandardTitle: string,
  lectureFee: number,
  sessionStart: number
):
  | PaymentOrderCalculationBasisDetailLectureFeeTier
  | PaymentOrderCalculationBasisDetailLectureFeeSpecial
  | PaymentOrderCalculationBasisDetailLectureFeeGemini {
  if (isSpecialLectureFeeTitle(lectureFeeStandardTitle)) {
    return buildLectureFeeSpecialBasisDetail(lectureFee, sessionStart)
  }
  if (isGeminiLectureFeeTitle(lectureFeeStandardTitle)) {
    return buildLectureFeeGeminiBasisDetail(lectureFee, sessionStart)
  }
  return buildLectureFeeTierBasisDetail(lectureFeeStandardTitle, lectureFee, sessionStart)
}

export function lectureFeeLineDescriptionFromStandardTitle(lectureFeeStandardTitle: string): string {
  if (isSpecialLectureFeeTitle(lectureFeeStandardTitle)) {
    return '프로그램 1회 강의비 (특강 강사)'
  }
  if (isGeminiLectureFeeTitle(lectureFeeStandardTitle)) {
    return '프로그램 1회 강의비 (제미나이 강사)'
  }
  const tier = LECTURE_FEE_TIER_TITLE_MAP[lectureFeeStandardTitle]
  if (tier) {
    return `프로그램 1회 강의비 (${tier}급 강사)`
  }
  const short = lectureFeeStandardTitle.replace(/ 강사비$/, '')
  return `프로그램 1회 강의비 (${short})`
}

export function parseLectureSessionStartFromDisplay(sessionDisplay: string): number {
  const match = sessionDisplay.match(/(\d+)/)
  if (!match) return 1
  const n = Number.parseInt(match[1], 10)
  return Number.isFinite(n) && n > 0 ? n : 1
}

function hashLineSeed(lineId: string): number {
  let hash = 0
  for (let i = 0; i < lineId.length; i += 1) {
    hash = (hash * 31 + lineId.charCodeAt(i)) >>> 0
  }
  return hash
}

export type PaymentOrderCalculationBasisDetailResolveContext = {
  lectureFeeStandardTitle?: string
  /** 원천징수 fallback — 세전 1일 급여 총액 */
  withholdingDailySalaryTotalWon?: number
}

/** 원천징수 산정 — 세전 1일 급여 총액(양수 항목 합) */
export function computePaymentOrderCalculationSubtotalBeforeWithholding(
  blocks: PaymentOrderCalculationStatementSessionBlock[]
): number {
  return blocks
    .flatMap(block => block.lines)
    .filter(line => line.amount > 0)
    .reduce((sum, line) => sum + line.amount, 0)
}

function isLectureFeeBasisDetail(
  detail: PaymentOrderCalculationBasisDetail
): detail is
  | PaymentOrderCalculationBasisDetailLectureFeeTier
  | PaymentOrderCalculationBasisDetailLectureFeeSpecial
  | PaymentOrderCalculationBasisDetailLectureFeeGemini {
  return (
    detail.layout === 'lectureFeeTier' ||
    detail.layout === 'lectureFeeSpecial' ||
    detail.layout === 'lectureFeeGemini'
  )
}

function isLectureFeeCalculationRow(row: { kind: string; itemLabel: string }): boolean {
  return row.kind === 'lecture_fee' || row.itemLabel === '강의비' || row.itemLabel === '강사비'
}

function resolveLectureFeeStandardTitleForRow(
  row: {
    basisDetail?: PaymentOrderCalculationBasisDetail
  },
  context?: PaymentOrderCalculationBasisDetailResolveContext | null
): string {
  const fromContext = context?.lectureFeeStandardTitle?.trim()
  if (!isGenericLectureFeeCategoryLabel(fromContext)) {
    return fromContext as string
  }
  if (row.basisDetail && isLectureFeeBasisDetail(row.basisDetail)) {
    const fromDetail = row.basisDetail.categoryLabel.trim()
    if (!isGenericLectureFeeCategoryLabel(fromDetail)) {
      return fromDetail
    }
  }
  return '2급 강사비'
}

/** 행 payload·기본정보로 산정 기준 상세 fallback 생성 (mock/API 공통) */
export function resolvePaymentOrderCalculationBasisDetailForRow(
  row: {
    kind: string
    itemLabel: string
    amount: number
    lineId: string
    lectureSessionDisplay: string
    basisDetail?: PaymentOrderCalculationBasisDetail
  },
  context?: PaymentOrderCalculationBasisDetailResolveContext | null
): PaymentOrderCalculationBasisDetail | undefined {
  const sessionStart = parseLectureSessionStartFromDisplay(row.lectureSessionDisplay)

  if (isLectureFeeCalculationRow(row)) {
    return buildLectureFeeBasisDetailFromStandardTitle(
      resolveLectureFeeStandardTitleForRow(row, context),
      row.amount,
      sessionStart
    )
  }

  if (row.basisDetail && isSupportedBasisDetailLayout(row.basisDetail)) {
    return row.basisDetail
  }

  const seed = hashLineSeed(row.lineId)

  if (row.kind === 'withholding' || row.itemLabel === '원천징수') {
    const dailyTotal = context?.withholdingDailySalaryTotalWon
    if (dailyTotal && dailyTotal > 0) {
      return buildWithholdingBasisDetail(dailyTotal)
    }
    return buildWithholdingBasisDetail(300000)
  }

  if (row.kind === 'travel' || row.itemLabel === '교통비') {
    return buildTravelBasisDetail(seed)
  }

  if (row.kind === 'lodging' || row.itemLabel === '숙박비') {
    return buildLodgingBasisDetail(seed)
  }

  if (row.kind === 'meal' || row.itemLabel === '식사비') {
    return buildMealBasisDetail()
  }

  if (row.kind === 'activity' || row.itemLabel === '활동비') {
    return buildActivityBasisDetail()
  }

  return undefined
}
