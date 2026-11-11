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

/** 강사비 책정 방식 (기획 확정 2026-11-11) */
const PRICING_MODE_LABEL: Record<string, string> = {
  PROGRAM_STANDARD: '프로그램 기준',
  SPECIAL_LECTURE: '특강 강사비',
  OTHER_LABOR: '기타 인건비',
}

/** 프로그램 기준 적용 등급 (시간당 단가) */
const TIER_LABEL: Record<string, string> = {
  TIER1: '1급',
  TIER2: '2급',
  TIER3: '3급',
}

function normalizeCode(value: string | null | undefined): string | null {
  const key = value?.trim().toUpperCase()
  return key ? key : null
}

export function correctionPricingModeLabel(value: string | null | undefined): string {
  const key = normalizeCode(value)
  return (key && PRICING_MODE_LABEL[key]) || MISSING
}

/** 특강·기타 인건비 지급 기준: 차시 기준은 "차시당", PER_SESSION·PER_LECTURE는 "출강 1회당" */
function paymentBasisLabel(unit: string | null): string {
  if (unit === 'PER_HOUR' || unit === 'PER_CLASS') return '차시당'
  if (unit === 'PER_SESSION' || unit === 'PER_LECTURE') return '출강 1회당'
  return MISSING
}

/**
 * 적용 등급 또는 지급 기준.
 * 프로그램 기준이면 "1급"/"2급"/"3급", 특강·기타 인건비면 "차시당"/"출강 1회당".
 * "등급 카탈로그 기준"(CATALOG_TIER)은 표시하지 않는다.
 */
export function correctionGradeOrBasisLabel(
  side: PaymentStatementCorrectionSide | null | undefined,
): string {
  const pricingMode = normalizeCode(side?.pricingMode)
  const wageItemType = normalizeCode(side?.wageItemType)
  const unit = normalizeCode(side?.calculationUnit)
  if (pricingMode === 'PROGRAM_STANDARD' || (!pricingMode && wageItemType && TIER_LABEL[wageItemType])) {
    return (wageItemType && TIER_LABEL[wageItemType]) || MISSING
  }
  return paymentBasisLabel(unit)
}

export function formatCorrectionWon(amount: number | null | undefined): string {
  if (amount == null || !Number.isFinite(amount)) return MISSING
  return `${amount.toLocaleString('ko-KR')}원`
}
