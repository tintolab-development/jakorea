import type { GeminiTrainingReportImportResult } from '@/shared/api/generated/dashboard/schemas/geminiTrainingReportImportResult'

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
    return '강사명과 연락처를 입력해 주세요.'
  }
  return message || '등록할 수 없는 행입니다.'
}

export function isGeminiImportResultSuccess(
  result: GeminiTrainingReportImportResult
): boolean {
  return result.status === 'SUCCESS'
}

export function formatGeminiImportPreviewFailures(
  results: GeminiTrainingReportImportResult[] | undefined
): string | undefined {
  const failed = (results ?? []).filter(result => !isGeminiImportResultSuccess(result))
  if (failed.length === 0) return undefined
  return failed
    .map(result => {
      const prefix = result.rowNumber != null ? `${result.rowNumber}행: ` : ''
      return `${prefix}${describeFailure(result.message ?? '')}`
    })
    .join('\n')
}
