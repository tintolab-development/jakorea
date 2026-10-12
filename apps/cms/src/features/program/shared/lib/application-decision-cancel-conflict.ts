import {
  extractApiErrorCode,
  extractApiErrorMessage,
  getApiErrorHttpStatus,
} from '@/shared/lib/extract-api-error-message'

export const FINAL_RESULT_NOT_FAILED = 'FINAL_RESULT_NOT_FAILED'
export const FINAL_RESULT_NOT_PASSED = 'FINAL_RESULT_NOT_PASSED'
export const DOCUMENT_STATUS_CONFLICT = 'DOCUMENT_STATUS_CONFLICT'
export const APPLICATION_DECISION_CONFLICT = 'APPLICATION_DECISION_CONFLICT'
export const INVALID_NOTIFICATION_SCHEDULE = 'INVALID_NOTIFICATION_SCHEDULE'

const CODE_MESSAGES: Record<string, string> = {
  [FINAL_RESULT_NOT_FAILED]:
    '최종 불합격 상태가 아니어서 불합격 취소를 할 수 없습니다. 화면을 새로고침한 뒤 다시 시도해 주세요.',
  [FINAL_RESULT_NOT_PASSED]:
    '최종 합격·예비 상태가 아니어서 합격 취소를 할 수 없습니다. 화면을 새로고침한 뒤 다시 시도해 주세요.',
  [DOCUMENT_STATUS_CONFLICT]:
    '서류·최종 단계와 맞지 않는 취소 요청입니다. 표시된 취소 버튼으로 다시 시도해 주세요.',
  [INVALID_NOTIFICATION_SCHEDULE]:
    '알림 예약 일시가 올바르지 않습니다. 일시를 확인한 뒤 다시 시도해 주세요.',
  [APPLICATION_DECISION_CONFLICT]:
    '현재 신청 상태에서는 처리할 수 없습니다. 화면을 새로고침한 뒤 다시 시도해 주세요.',
}

/** 신청 취소·최종 결과 overwrite 409 — Alert 본문. 해당 없으면 `null`. */
export function formatApplicationDecisionCancelConflictMessage(error: unknown): string | null {
  if (!error || typeof error !== 'object' || !('response' in error)) return null
  const data = (error as { response?: { data?: unknown } }).response?.data
  const code = extractApiErrorCode(data)
  if (!code) return null
  const mapped = CODE_MESSAGES[code]
  if (mapped) return mapped
  if (code === APPLICATION_DECISION_CONFLICT) {
    return extractApiErrorMessage(data, {
      httpStatus: getApiErrorHttpStatus(error),
      fallback: CODE_MESSAGES[APPLICATION_DECISION_CONFLICT],
    })
  }
  return null
}
