import {
  extractApiErrorCode,
  getApiErrorHttpStatus,
} from '@/shared/lib/extract-api-error-message'

/** 신청 반려 API 사유 길이 (서버 Bean Validation Size(2, 500)) */
export const APPLICATION_REJECT_REASON_MIN_LENGTH = 2
export const APPLICATION_REJECT_REASON_MAX_LENGTH = 500

export const APPLICATION_REJECT_REASON_LENGTH_MESSAGE =
  '반려 사유는 2자 이상 500자 이하로 입력해 주세요.'

function readErrorField(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null
  const error = (data as { error?: unknown }).error
  if (!error || typeof error !== 'object') return null
  const field = (error as { field?: unknown }).field
  return typeof field === 'string' ? field.trim() : null
}

/**
 * 반려 사유 검증 실패(400 VALIDATION_FAILED, field=reason) — 서버 문구("크기가 2에서 500 사이여야 합니다")
 * 대신 반려 사유 안내를 보여준다. 해당 없으면 null.
 */
export function formatApplicationRejectReasonErrorMessage(error: unknown): string | null {
  if (!error || typeof error !== 'object' || !('response' in error)) return null
  const data = (error as { response?: { data?: unknown } }).response?.data
  if (extractApiErrorCode(data) !== 'VALIDATION_FAILED') return null
  const status = getApiErrorHttpStatus(error)
  if (status != null && status !== 400) return null
  const field = readErrorField(data)
  if (field !== 'reason' && field !== 'rejectionReason') return null
  return APPLICATION_REJECT_REASON_LENGTH_MESSAGE
}
