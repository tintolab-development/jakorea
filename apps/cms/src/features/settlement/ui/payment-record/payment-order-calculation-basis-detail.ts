/**
 * 산출 내역서 — 산정 기준 상세 모달 payload (read-only viewer SSOT)
 */

import type { PaymentOrderCalculationStatementSessionBlock } from '@/features/settlement-management/model/payment-order-admin-list'
import type {
  SettlementFrontendCalculationDetailResponse,
  SettlementTransportationSnapshotResponse,
} from '@/shared/api/generated/settlement/schemas'

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

/** 거리 스냅샷·basisJson이 모두 없을 때 교통비 상세 안내 (F3-2) */
export const DISTANCE_SNAPSHOT_UNLINKED_NOTICE = '거리 스냅샷 미연결 — 산출 금액만 표시'

/** 정산 거리 스냅샷 API 기반 교통비 상세 */
export interface PaymentOrderCalculationBasisDetailTransportSnapshot {
  layout: 'transportSnapshot'
  provider?: string
  oneWayDistanceKm?: number
  roundTripDistanceKm?: number
  tollAmount?: number
  fuelType?: string
  fuelCostWon?: number
  calculatedTransportAmount?: number
  snapshotAt?: string
  /** true면 거리 스냅샷이 없어 산출 금액만 표시한다. */
  distanceSnapshotUnlinked?: boolean
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

/** 활동비 */
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

/** 백엔드가 내려준 표시용 calculationDetail snapshot을 읽기 전용으로 표시한다. */
export interface PaymentOrderCalculationBasisDetailRemote {
  layout: 'remote'
  sourceLayout?: string
  title: string
  formulaText?: string
  lineLabels: string[]
  formulaLines: string[]
  summaryLabels: string[]
  resultAmount?: number
  iconKey?: string
  emojiOverride?: string
}

export type PaymentOrderCalculationBasisDetail =
  | PaymentOrderCalculationBasisDetailLectureFeeTier
  | PaymentOrderCalculationBasisDetailLectureFeeSpecial
  | PaymentOrderCalculationBasisDetailLectureFeeGemini
  | PaymentOrderCalculationBasisDetailTransportRoundTrip
  | PaymentOrderCalculationBasisDetailTransportOneWay
  | PaymentOrderCalculationBasisDetailTransportInstructor
  | PaymentOrderCalculationBasisDetailTransportSnapshot
  | PaymentOrderCalculationBasisDetailLodgingGeneral
  | PaymentOrderCalculationBasisDetailLodging1s1g
  | PaymentOrderCalculationBasisDetailMeal
  | PaymentOrderCalculationBasisDetailActivity
  | PaymentOrderCalculationBasisDetailWithholding
  | PaymentOrderCalculationBasisDetailRemote

const LECTURE_FEE_TIER_TITLE_MAP: Record<
  string,
  PaymentOrderCalculationBasisDetailLectureFeeTier['tier']
> = {
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
    categoryLabel: '학생 교통비',
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
    case 'transportSnapshot':
      return '교통비 산정 기준 상세'
    case 'lodgingGeneral':
      return '숙박비 산정 기준 상세'
    case 'lodging1s1g':
      return '1사1교 숙박비 산정 기준 상세'
    case 'meal':
      return '식사비 산정 기준 상세'
    case 'activity':
      return '참여자 활동비 산정 기준 상세'
    case 'withholding':
      return '원천징수 산정 기준 상세'
    case 'remote':
      return detail.title || '산정 기준 상세'
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
    detail.layout === 'transportSnapshot' ||
    detail.layout === 'lodgingGeneral' ||
    detail.layout === 'lodging1s1g' ||
    detail.layout === 'meal' ||
    detail.layout === 'activity' ||
    detail.layout === 'withholding' ||
    detail.layout === 'remote'
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

export function mapTransportationSnapshotToBasisDetail(
  snapshot?: SettlementTransportationSnapshotResponse | null
): PaymentOrderCalculationBasisDetailTransportSnapshot | undefined {
  if (!snapshot) return undefined

  const hasDistanceOrProvider =
    Boolean(snapshot.provider?.trim()) ||
    snapshot.oneWayDistanceKm != null ||
    snapshot.roundTripDistanceKm != null ||
    snapshot.tollAmount != null ||
    Boolean(snapshot.fuelType?.trim()) ||
    Boolean(snapshot.snapshotAt)
  const hasValue = hasDistanceOrProvider || snapshot.calculatedTransportAmount != null
  if (!hasValue) return undefined

  return {
    layout: 'transportSnapshot',
    provider: snapshot.provider?.trim() || undefined,
    oneWayDistanceKm: snapshot.oneWayDistanceKm,
    roundTripDistanceKm: snapshot.roundTripDistanceKm,
    tollAmount: snapshot.tollAmount,
    fuelType: snapshot.fuelType?.trim() || undefined,
    calculatedTransportAmount: snapshot.calculatedTransportAmount,
    snapshotAt: snapshot.snapshotAt,
    distanceSnapshotUnlinked: !hasDistanceOrProvider,
  }
}

function recordValue(record: Record<string, unknown>, ...keys: string[]): unknown {
  for (const key of keys) {
    if (record[key] != null) return record[key]
  }
  return undefined
}

function numberValue(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value !== 'string' || value.trim() === '') return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

/** settlement_calculation_detail.basis_jsonb에 보관된 교통비 스냅샷을 상세 모달 payload로 변환한다. */
export function mapTransportationCalculationDetailToBasisDetail(
  detail?: SettlementFrontendCalculationDetailResponse | null
): PaymentOrderCalculationBasisDetailTransportSnapshot | undefined {
  if (!detail) return undefined

  const candidates: Record<string, unknown>[] = []
  if (detail.basisJson?.trim()) {
    try {
      const parsed: unknown = JSON.parse(detail.basisJson)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        candidates.push(parsed as Record<string, unknown>)
      }
    } catch {
      // invalid JSON is handled by the regular calculationDetail mapper
    }
  }
  candidates.push(detail as unknown as Record<string, unknown>)

  for (const candidate of candidates) {
    const itemType = stringValue(recordValue(candidate, 'itemType'))?.toLowerCase()
    const layout = stringValue(recordValue(candidate, 'layout'))?.toLowerCase()
    const isTransportation =
      itemType?.includes('transport') === true ||
      layout?.includes('transport') === true ||
      ['oneWayDistanceKm', 'roundTripDistanceKm', 'tollFeeWon', 'fuelCostWon'].some(key =>
        Object.prototype.hasOwnProperty.call(candidate, key)
      )
    if (!isTransportation) continue

    // fuelPricePerLiter는 백엔드 B2 합의 후 매핑한다.
    const mapped = {
      layout: 'transportSnapshot' as const,
      provider: stringValue(recordValue(candidate, 'provider')),
      oneWayDistanceKm: numberValue(recordValue(candidate, 'oneWayDistanceKm')),
      roundTripDistanceKm: numberValue(recordValue(candidate, 'roundTripDistanceKm')),
      tollAmount: numberValue(recordValue(candidate, 'tollAmount', 'tollFeeWon')),
      fuelType: stringValue(recordValue(candidate, 'fuelType')),
      fuelCostWon: numberValue(recordValue(candidate, 'fuelCostWon')),
      calculatedTransportAmount: numberValue(recordValue(candidate, 'calculatedTransportAmount')),
      snapshotAt: stringValue(recordValue(candidate, 'snapshotAt')),
    }

    const hasDistanceOrProvider =
      mapped.provider != null ||
      mapped.oneWayDistanceKm != null ||
      mapped.roundTripDistanceKm != null ||
      mapped.tollAmount != null ||
      mapped.fuelType != null ||
      mapped.fuelCostWon != null ||
      mapped.snapshotAt != null
    const hasValue = hasDistanceOrProvider || mapped.calculatedTransportAmount != null
    if (hasValue) {
      return {
        ...mapped,
        distanceSnapshotUnlinked: !hasDistanceOrProvider,
      }
    }
  }

  return undefined
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
):
  | PaymentOrderCalculationBasisDetailLodgingGeneral
  | PaymentOrderCalculationBasisDetailLodging1s1g {
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
  detail:
    | PaymentOrderCalculationBasisDetailLodgingGeneral
    | PaymentOrderCalculationBasisDetailLodging1s1g
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

/** mock·데모 — 활동비 (한도 5만원) */
export function buildActivityBasisDetail(): PaymentOrderCalculationBasisDetailActivity {
  const amountWon = 50000
  return {
    layout: 'activity',
    categoryLabel: '참여자 활동비',
    activityFee: {
      amountWon,
      receiptFileName: '참여자 활동비 영수증.pdf',
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
  lectureTimeDisplay = '-'
): PaymentOrderCalculationBasisDetailLectureFeeTier {
  const trimmed = lectureFeeStandardTitle.trim()
  const categoryLabel = isGenericLectureFeeCategoryLabel(trimmed) ? '-' : trimmed
  return {
    layout: 'lectureFeeTier',
    tier: resolveLectureFeeTier(categoryLabel),
    categoryLabel,
    feeAssessmentWon: lectureFee,
    lectureTimeDisplay,
    totalWon: lectureFee,
  }
}

const GENERIC_LECTURE_FEE_LABELS = new Set(['강사비', '강의비', '—', '-'])

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
  lectureTimeDisplay = '-'
): PaymentOrderCalculationBasisDetailLectureFeeGemini {
  return {
    layout: 'lectureFeeGemini',
    categoryLabel: GEMINI_LECTURE_FEE_TITLE,
    lectureTimeDisplay,
    feeAssessmentWon: lectureFee,
  }
}

export function buildLectureFeeSpecialBasisDetail(
  lectureFee: number,
  lectureTimeDisplay = '-'
): PaymentOrderCalculationBasisDetailLectureFeeSpecial {
  return {
    layout: 'lectureFeeSpecial',
    categoryLabel: SPECIAL_LECTURE_FEE_TITLE,
    feeAssessmentWon: lectureFee,
    lectureTimeDisplay,
    totalWon: lectureFee,
  }
}

export function buildLectureFeeBasisDetailFromStandardTitle(
  lectureFeeStandardTitle: string,
  lectureFee: number,
  lectureTimeDisplay = '-'
):
  | PaymentOrderCalculationBasisDetailLectureFeeTier
  | PaymentOrderCalculationBasisDetailLectureFeeSpecial
  | PaymentOrderCalculationBasisDetailLectureFeeGemini {
  if (isSpecialLectureFeeTitle(lectureFeeStandardTitle)) {
    return buildLectureFeeSpecialBasisDetail(lectureFee, lectureTimeDisplay)
  }
  if (isGeminiLectureFeeTitle(lectureFeeStandardTitle)) {
    return buildLectureFeeGeminiBasisDetail(lectureFee, lectureTimeDisplay)
  }
  return buildLectureFeeTierBasisDetail(lectureFeeStandardTitle, lectureFee, lectureTimeDisplay)
}

export function lectureFeeLineDescriptionFromStandardTitle(
  lectureFeeStandardTitle: string
): string {
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
  /** true이면 서버 calculationDetail이 없는 항목에 mock 기준을 만들지 않는다. */
  remoteData?: boolean
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
  return '-'
}

function resolveLectureTimeDisplayForRow(row: {
  basisDetail?: PaymentOrderCalculationBasisDetail
}): string {
  if (row.basisDetail && isLectureFeeBasisDetail(row.basisDetail)) {
    const fromDetail = row.basisDetail.lectureTimeDisplay.trim()
    if (fromDetail && fromDetail !== '-') return fromDetail
  }
  return '-'
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
  // 표시용 원격 snapshot은 기존 호환 fallback보다 우선한다.
  if (row.basisDetail?.layout === 'remote') {
    return row.basisDetail
  }

  if (context?.remoteData && row.basisDetail && isSupportedBasisDetailLayout(row.basisDetail)) {
    return row.basisDetail
  }

  // 원격 응답에 교통비 스냅샷·basisJson이 없으면 산출 금액만 표시하고 미연결 안내를 띄운다.
  if (context?.remoteData && (row.kind === 'travel' || row.itemLabel === '교통비')) {
    return mapTransportationSnapshotToBasisDetail({
      calculatedTransportAmount: row.amount,
    })
  }

  if (isLectureFeeCalculationRow(row)) {
    return buildLectureFeeBasisDetailFromStandardTitle(
      resolveLectureFeeStandardTitleForRow(row, context),
      row.amount,
      resolveLectureTimeDisplayForRow(row)
    )
  }

  if (row.basisDetail && isSupportedBasisDetailLayout(row.basisDetail)) {
    return row.basisDetail
  }

  if (context?.remoteData) {
    return undefined
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
    return undefined
  }

  if (row.kind === 'lodging' || row.itemLabel === '숙박비') {
    return buildLodgingBasisDetail(seed)
  }

  if (row.kind === 'meal' || row.itemLabel === '식사비') {
    return buildMealBasisDetail()
  }

  if (row.kind === 'activity' || row.itemLabel === '활동비' || row.itemLabel === '참여자 활동비') {
    return buildActivityBasisDetail()
  }

  return undefined
}
