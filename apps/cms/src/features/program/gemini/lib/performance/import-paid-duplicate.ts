import type { GeminiTrainingReportImportResult } from '@/shared/api/generated/dashboard/schemas/geminiTrainingReportImportResult'
import {
  getGeneralProgramApiErrorCode,
  getGeneralProgramApiErrorMessage,
} from '@/features/program/general/api/get-general-program-api-error'

/** 목록·preview 원본 `accountPaymentId`가 양수일 때만 계좌 지급 완료. 0·null·생략은 미지급. */
export function isGeminiPerformanceAccountPaid(
  accountPaymentId: number | null | undefined
): boolean {
  return accountPaymentId != null && Number.isFinite(accountPaymentId) && accountPaymentId > 0
}

export function hasPaidDuplicateImportResults(
  results: GeminiTrainingReportImportResult[] | undefined
): boolean {
  return (results ?? []).some(
    result => result.duplicate === true && isGeminiPerformanceAccountPaid(result.accountPaymentId)
  )
}

export function isGeminiPerformancePaidBlockedText(text: string | undefined): boolean {
  if (!text?.trim()) return false
  if (text.includes('계좌 지급이 완료')) return true
  if (text.includes('덮어쓸 수 없')) return true
  return /ACCOUNT_PAYMENT_COMPLETED|GEMINI_TRAINING_REPORT_ACCOUNT_PAID|GEMINI_TRAINING_REPORT_PAID|ACCOUNT_PAID/.test(
    text
  )
}

export function isGeminiPerformancePaidBlockedError(error: unknown): boolean {
  const code = getGeneralProgramApiErrorCode(error)?.trim()
  if (code && isGeminiPerformancePaidBlockedText(code)) return true
  if (error instanceof Error && isGeminiPerformancePaidBlockedText(error.message)) return true
  return isGeminiPerformancePaidBlockedText(getGeneralProgramApiErrorMessage(error, ''))
}

export function hasPaidBlockedImportFailures(
  results: GeminiTrainingReportImportResult[] | undefined
): boolean {
  return (results ?? []).some(
    result =>
      result.status !== 'SUCCESS' && isGeminiPerformancePaidBlockedText(result.message)
  )
}
