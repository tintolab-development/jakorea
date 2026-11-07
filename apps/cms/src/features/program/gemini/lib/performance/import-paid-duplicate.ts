import type { GeminiTrainingReportImportResult } from '@/shared/api/generated/dashboard/schemas/geminiTrainingReportImportResult'
import {
  getGeneralProgramApiErrorCode,
  getGeneralProgramApiErrorMessage,
} from '@/features/program/general/api/get-general-program-api-error'

export const GEMINI_TRAINING_REPORT_ACCOUNT_PAID_CODE = 'GEMINI_TRAINING_REPORT_ACCOUNT_PAID'

/** 목록 삭제 UI의 기존 사전 차단용 판정. import 보호 중복 판정에는 사용하지 않는다. */
export function isGeminiPerformanceAccountPaid(
  accountPaymentId: number | null | undefined
): boolean {
  return accountPaymentId != null && Number.isFinite(accountPaymentId) && accountPaymentId > 0
}

/** 백엔드 결과의 machine code만으로 지급조서/계좌 보호 중복을 판정한다. */
export function getGeminiPerformancePaidBlockedResultMessage(
  results: GeminiTrainingReportImportResult[] | undefined
): string | undefined {
  const blocked = (results ?? []).find(
    result => result.status !== 'SUCCESS' && isGeminiPerformancePaidBlockedText(result.message)
  )
  const message = blocked?.message
  return message ?? undefined
}

export function hasPaidDuplicateImportResults(
  results: GeminiTrainingReportImportResult[] | undefined
): boolean {
  return getGeminiPerformancePaidBlockedResultMessage(results) != null
}

export function isGeminiPerformancePaidBlockedText(text: string | null | undefined): boolean {
  if (!text?.trim()) return false
  const code = text.split(':', 1)[0]?.trim()
  return code === GEMINI_TRAINING_REPORT_ACCOUNT_PAID_CODE
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
  return getGeminiPerformancePaidBlockedResultMessage(results) != null
}

/** preview/import 응답에서 지급완료 등록 불가(strategy 무관). */
export function isGeminiPerformancePaidRegisterBlocked(
  results: GeminiTrainingReportImportResult[] | undefined
): boolean {
  return hasPaidDuplicateImportResults(results) || hasPaidBlockedImportFailures(results)
}
