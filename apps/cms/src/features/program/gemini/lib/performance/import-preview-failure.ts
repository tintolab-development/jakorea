import type { GeminiTrainingReportImportResult } from '@/shared/api/generated/dashboard/schemas/geminiTrainingReportImportResult'
import { isGeminiPerformancePaidBlockedText } from '@/features/program/gemini/lib/performance/import-paid-duplicate'
import {
  formatGeminiPaymentExclusionReason,
  isGeminiInstructorSoftPaymentExclusion,
} from '@/features/program/gemini/lib/performance/payment-exclusion'

function describeFailure(message: string): string {
  if (message.includes('GEMINI_TRAINING_END_TIME_NOT_AFTER_START')) {
    return '종료 시각이 시작 시각보다 늦어야 합니다.'
  }
  if (message.includes('programId is required') || message.includes('not a Gemini training program')) {
    return '연결할 Gemini 모집 공고가 없습니다.'
  }
  if (message.includes('trainingSessionCount')) {
    return '연수 차시는 2, 3, 4 중 하나여야 합니다.'
  }
  if (message.includes('trainingDate is required')) {
    return '교육일 형식을 확인해 주세요. (예: 2026-09-30)'
  }
  if (message.includes('trainingStartTime') || message.includes('trainingEndTime')) {
    return '연수 시작·종료 시간을 확인해 주세요. (예: 10:00)'
  }
  if (message.includes('GEMINI_INSTRUCTOR_MATCH_AMBIGUOUS')) {
    return '동일 이름·연락처 강사가 여러 명입니다.'
  }
  if (message.includes('GEMINI_INSTRUCTOR_NOT_MATCHED')) {
    return '강사명과 연락처가 일치하는 강사 회원을 찾지 못했습니다.'
  }
  if (message.includes('GEMINI_INSTRUCTOR_NAME_AND_PHONE_REQUIRED')) {
    return '강사명과 연락처를 모두 입력하거나, 둘 다 비워 실적만 등록해 주세요.'
  }
  return message || '등록할 수 없는 행입니다.'
}

export function isGeminiImportResultSuccess(
  result: GeminiTrainingReportImportResult
): boolean {
  return result.status === 'SUCCESS'
}

/**
 * SUCCESS + 지급 제외(실적만) 안내. FAILED가 아니므로 formatGeminiImportPreviewFailures에 넣지 않는다.
 */
export function formatGeminiImportPaymentExclusionNotes(
  results: GeminiTrainingReportImportResult[] | undefined
): string | undefined {
  const notes = (results ?? [])
    .filter(
      result =>
        isGeminiImportResultSuccess(result) &&
        Boolean(formatGeminiPaymentExclusionReason(result.paymentExclusionReason))
    )
    .map(result => {
      const prefix = result.rowNumber != null ? `${result.rowNumber}행: ` : ''
      const label = formatGeminiPaymentExclusionReason(result.paymentExclusionReason)!
      // IDENTITY_BLANK / NOT_MATCHED 라벨에 실적만 안내가 포함되므로 접두어를 붙이지 않는다.
      if (isGeminiInstructorSoftPaymentExclusion(result.paymentExclusionReason)) {
        return `${prefix}${label}`
      }
      return `${prefix}지급 제외 — ${label}`
    })
  if (notes.length === 0) return undefined
  return notes.join('\n')
}

export function formatGeminiImportPreviewFailures(
  results: GeminiTrainingReportImportResult[] | undefined
): string | undefined {
  // 지급완료 중복 FAILED는 「실적 등록 불가」전용 — 일반 행 실패 문구에 섞지 않는다.
  const failed = (results ?? []).filter(
    result =>
      !isGeminiImportResultSuccess(result) &&
      !isGeminiPerformancePaidBlockedText(result.message)
  )
  if (failed.length === 0) return undefined
  return failed
    .map(result => {
      const prefix = result.rowNumber != null ? `${result.rowNumber}행: ` : ''
      return `${prefix}${describeFailure(result.message ?? '')}`
    })
    .join('\n')
}
