/**
 * 정산 관리 · 지급 정정 — 산출 내역서 「지급 정정」 팝업 입력 ↔
 * `PATCH /api/admin/settlements/correction-requests/{id}/approve` 본문.
 *
 * BE 재산정 규칙 (SettlementCorrectionRecalculationService)
 * - PROGRAM_STANDARD: wageItemType TIER1~3 필수, 단가는 프로그램 저장값(unitAmount·calculationUnit 미사용)
 * - SPECIAL_LECTURE / OTHER_LABOR: unitAmount(>0)·calculationUnit 필수, wageItemType은 방식과 같은 값
 * - calculationUnit: PER_CLASS(차시당) | PER_LECTURE(출강 1회당). 기획(CMS-FUNC-0076·0473·0474):
 *   지급 기준 라벨은 모든 유형 「차시당 / 출강 1회당」 두 가지.
 *   레거시 PER_HOUR(옛 「1시간 기준」)는 OpenAPI상 「차시당 단가(시간 비례 아님)」로 PER_CLASS와 같은 계산
 *   (단가 × 인정 차시)이므로 새로 고를 때는 PER_CLASS만 보낸다.
 */

import type { SettlementCorrectionApprovalRequest } from '@/shared/api/generated/settlement/schemas'
import type { PaymentOrderAdminLineProcessingStatus } from '@/features/settlement-management/model/payment-order-admin-list'
import { INSTRUCTOR_FEE_GRADE_LABELS } from '@/shared/constants/instructor-fee-grade'

export type PaymentCorrectionPricingMode = 'PROGRAM_STANDARD' | 'SPECIAL_LECTURE' | 'OTHER_LABOR'
export type PaymentCorrectionStandardWageType = 'TIER1' | 'TIER2' | 'TIER3'
export type PaymentCorrectionCalculationUnit = 'PER_LECTURE' | 'PER_CLASS'

export const PAYMENT_CORRECTION_PRICING_MODE_OPTIONS: {
  value: PaymentCorrectionPricingMode
  label: string
}[] = [
  { value: 'PROGRAM_STANDARD', label: '프로그램 기준 적용' },
  { value: 'SPECIAL_LECTURE', label: '특강 강사비 적용' },
  { value: 'OTHER_LABOR', label: '기타 인건비 적용' },
]

export const PAYMENT_CORRECTION_STANDARD_WAGE_OPTIONS: {
  value: PaymentCorrectionStandardWageType
  label: string
}[] = [
  { value: 'TIER1', label: INSTRUCTOR_FEE_GRADE_LABELS.GRADE_1 },
  { value: 'TIER2', label: INSTRUCTOR_FEE_GRADE_LABELS.GRADE_2 },
  { value: 'TIER3', label: INSTRUCTOR_FEE_GRADE_LABELS.GRADE_3 },
]

export const PAYMENT_CORRECTION_CALCULATION_UNIT_OPTIONS: {
  value: PaymentCorrectionCalculationUnit
  label: string
}[] = [
  { value: 'PER_CLASS', label: '차시당' },
  { value: 'PER_LECTURE', label: '출강 1회당' },
]

export type PaymentCorrectionFormValue = {
  pricingMode: PaymentCorrectionPricingMode | null
  standardWageType: PaymentCorrectionStandardWageType | null
  calculationUnit: PaymentCorrectionCalculationUnit | null
  /** 숫자만 (천단위 구분 없음) */
  unitAmount: string
}

export const EMPTY_PAYMENT_CORRECTION_FORM: PaymentCorrectionFormValue = {
  pricingMode: null,
  standardWageType: null,
  calculationUnit: null,
  unitAmount: '',
}

export function isPaymentCorrectionManualPricing(
  mode: PaymentCorrectionPricingMode | null
): mode is 'SPECIAL_LECTURE' | 'OTHER_LABOR' {
  return mode === 'SPECIAL_LECTURE' || mode === 'OTHER_LABOR'
}

export type PaymentCorrectionApprovalBuildResult =
  | { ok: true; body: SettlementCorrectionApprovalRequest }
  | { ok: false; message: string }

export function buildPaymentCorrectionApprovalRequest(
  form: PaymentCorrectionFormValue
): PaymentCorrectionApprovalBuildResult {
  const { pricingMode } = form
  if (!pricingMode) return { ok: false, message: '강사비 책정 방식을 선택해 주세요.' }

  if (pricingMode === 'PROGRAM_STANDARD') {
    if (!form.standardWageType) return { ok: false, message: '강사비 유형을 선택해 주세요.' }
    return {
      ok: true,
      body: { pricingMode, wageItemType: form.standardWageType },
    }
  }

  if (!form.calculationUnit) return { ok: false, message: '지급 기준을 선택해 주세요.' }
  const digits = form.unitAmount.replace(/[^\d]/g, '')
  const unitAmount = digits ? Number(digits) : Number.NaN
  if (!Number.isSafeInteger(unitAmount) || unitAmount <= 0) {
    return { ok: false, message: '강사비를 입력해 주세요.' }
  }
  return {
    ok: true,
    body: {
      pricingMode,
      wageItemType: pricingMode,
      calculationUnit: form.calculationUnit,
      unitAmount,
    },
  }
}

/** 산출 내역서 「신청 반려 / 지급 정정」 노출 조건 — 정정 요청 상태 + 대상 id 있음 */
export function canProcessPaymentCorrection(input: {
  enabled: boolean
  paymentOrdersRemote: boolean
  processingStatusClass: PaymentOrderAdminLineProcessingStatus
  correctionRequestId?: number | null
}): boolean {
  return (
    input.enabled &&
    input.paymentOrdersRemote &&
    input.processingStatusClass === 'correction' &&
    input.correctionRequestId != null
  )
}
