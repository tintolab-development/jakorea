import { getApiErrorCode, getApiErrorHttpStatus } from '@/shared/lib/extract-api-error-message'

/** 개인정보 원문 응답 전 감사 로그 저장 실패. 이 코드에서는 원문을 반환하지 않는다. */
export const AUDIT_LOG_UNAVAILABLE_CODE = 'AUDIT_LOG_UNAVAILABLE'

export function isAuditLogUnavailableError(error: unknown): boolean {
  return (
    getApiErrorHttpStatus(error) === 503 && getApiErrorCode(error) === AUDIT_LOG_UNAVAILABLE_CODE
  )
}

export function isForbiddenApiError(error: unknown): boolean {
  return getApiErrorHttpStatus(error) === 403
}
