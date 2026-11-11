import { instructorFeeUnitDisplayLabel } from './lecture-fee-preview.ts'

/** 정정 전·후 강사비 내역 (모든 필드 nullable) */
export type PaymentStatementCorrectionSide = {
  /** PROGRAM_STANDARD | SPECIAL_LECTURE | OTHER_LABOR */
  pricingMode?: string | null
  /** TIER1~3 | SPECIAL_LECTURE | OTHER_LABOR */
  wageItemType?: string | null
  /** 화면용 이름. 강사비 유형·적용 등급은 이 값을 그대로 표시 */
  wageTitle?: string | null
  /** PER_HOUR | PER_CLASS | PER_SESSION | PER_LECTURE | CATALOG_TIER */
  calculationUnit?: string | null
  unitAmount?: number | null
  lectureFee?: number | null
  netPaymentAmount?: number | null
}

/** GET /api/portal/me/settlements/{settlementId}/payment-statement/correction */
export type PaymentStatementCorrectionDetail = {
  settlementId?: number | null
  previousSettlementId?: number | null
  correctionRequestId?: number | null
  requestReason?: string | null
  requestedAt?: string | null
  correctedAt?: string | null
  before?: PaymentStatementCorrectionSide | null
  after?: PaymentStatementCorrectionSide | null
  reapplyAvailable?: boolean | null
  reapplyDeadlineDate?: string | null
}

const MISSING = '-'

/** 책정 방식 — 기존 표시 규칙이 없어 BE 계약의 의미를 그대로 쓴다 (기획 문구 확인 필요) */
const PRICING_MODE_LABEL: Record<string, string> = {
  PROGRAM_STANDARD: '프로그램 등급 기준',
  SPECIAL_LECTURE: '특강',
  OTHER_LABOR: '기타 인건비',
}

export function correctionPricingModeLabel(value: string | null | undefined): string {
  const key = value?.trim().toUpperCase()
  return (key && PRICING_MODE_LABEL[key]) || MISSING
}

/** 단가 기준 — 차시당·출강 1회당은 기존 강사비 표시 규칙을 재사용, 등급 카탈로그는 BE 계약 의미 */
export function correctionCalculationUnitLabel(value: string | null | undefined): string {
  const key = value?.trim().toUpperCase()
  if (!key) return MISSING
  if (key === 'CATALOG_TIER') return '등급 카탈로그 기준'
  const label = instructorFeeUnitDisplayLabel(
    key as Parameters<typeof instructorFeeUnitDisplayLabel>[0],
  )
  return label || MISSING
}

export function formatCorrectionWon(amount: number | null | undefined): string {
  if (amount == null || !Number.isFinite(amount)) return MISSING
  return `${amount.toLocaleString('ko-KR')}원`
}

export function correctionWageTitle(side: PaymentStatementCorrectionSide | null | undefined): string {
  return side?.wageTitle?.trim() || MISSING
}

/** 단가 기준·단가 한 줄: "등급 카탈로그 기준 450,000원" */
export function correctionUnitText(side: PaymentStatementCorrectionSide | null | undefined): string {
  const unit = correctionCalculationUnitLabel(side?.calculationUnit)
  const amount = formatCorrectionWon(side?.unitAmount)
  if (unit === MISSING && amount === MISSING) return MISSING
  if (unit === MISSING) return amount
  if (amount === MISSING) return unit
  return `${unit} ${amount}`
}
