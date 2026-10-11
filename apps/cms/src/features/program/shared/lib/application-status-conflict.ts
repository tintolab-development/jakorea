import {
  extractApiErrorCode,
  extractApiErrorMessage,
  getApiErrorHttpStatus,
} from '@/shared/lib/extract-api-error-message'

const APPLICATION_STATUS_CONFLICT = 'APPLICATION_STATUS_CONFLICT'

const DEFAULT_STATUS_CONFLICT_MESSAGE =
  '이미 취소되었거나 반려 상태가 아닙니다. 화면을 새로고침해 주세요.'

/** 신청 상태 불일치 409 — Alert/토스트 본문. 해당 없으면 `null`. */
export function formatApplicationStatusConflictMessage(error: unknown): string | null {
  if (!error || typeof error !== 'object' || !('response' in error)) return null
  const data = (error as { response?: { data?: unknown } }).response?.data
  if (extractApiErrorCode(data) !== APPLICATION_STATUS_CONFLICT) return null
  return extractApiErrorMessage(data, {
    httpStatus: getApiErrorHttpStatus(error),
    fallback: DEFAULT_STATUS_CONFLICT_MESSAGE,
  })
}
