import { GeminiTrainingReportItemPaymentExclusionReason } from '@/shared/api/generated/dashboard/schemas/geminiTrainingReportItemPaymentExclusionReason'

/**
 * 계좌 지급 제외 사유 라벨 (OpenAPI paymentExclusionReason).
 */
export const GEMINI_PAYMENT_EXCLUSION_REASON_LABELS: Record<string, string> = {
  [GeminiTrainingReportItemPaymentExclusionReason.ZERO_CALCULATED_FEE]:
    '산출 강사비 0원 (지급 제외)',
  [GeminiTrainingReportItemPaymentExclusionReason.GEMINI_WAGE_RATE_NOT_CONFIGURED]:
    '강사비 단가 미설정 (지급 제외)',
  [GeminiTrainingReportItemPaymentExclusionReason.GEMINI_INSTRUCTOR_IDENTITY_BLANK]:
    '강사 정보 미기재 (실적만 등록, 계좌 지급 제외)',
  [GeminiTrainingReportItemPaymentExclusionReason.GEMINI_INSTRUCTOR_EXTERNAL_PAYEE]:
    '외부 지급처 (실적만 등록, 계좌 지급 제외)',
}

export function isGeminiInstructorIdentityBlankExclusion(
  reason: string | null | undefined
): boolean {
  return reason === GeminiTrainingReportItemPaymentExclusionReason.GEMINI_INSTRUCTOR_IDENTITY_BLANK
}

export function isGeminiInstructorExternalPayeeExclusion(
  reason: string | null | undefined
): boolean {
  return reason === GeminiTrainingReportItemPaymentExclusionReason.GEMINI_INSTRUCTOR_EXTERNAL_PAYEE
}

/** 실적만 등록되고 계좌 지급이 제외되는 강사 관련 사유 */
export function isGeminiInstructorPerformanceOnlyExclusion(
  reason: string | null | undefined
): boolean {
  return (
    isGeminiInstructorIdentityBlankExclusion(reason) ||
    isGeminiInstructorExternalPayeeExclusion(reason)
  )
}

export function formatGeminiPaymentExclusionReason(
  reason: string | null | undefined
): string | undefined {
  const key = reason?.trim()
  if (!key) return undefined
  return GEMINI_PAYMENT_EXCLUSION_REASON_LABELS[key]
}

/** 지급 제외 사유 표시용. null이면 지급 대상(또는 기존 플로우) → `-`. */
export function displayGeminiPaymentExclusionCell(
  reason: string | null | undefined
): string {
  return formatGeminiPaymentExclusionReason(reason) ?? '-'
}
