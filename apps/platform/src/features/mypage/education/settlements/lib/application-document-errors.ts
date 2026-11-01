import { isAxiosError } from 'axios'

export const SETTLEMENT_APPLICATION_DOCUMENT_NOT_FOUND_CODE =
  'SETTLEMENT_APPLICATION_DOCUMENT_NOT_FOUND'
export const AUDIT_LOG_UNAVAILABLE_CODE = 'AUDIT_LOG_UNAVAILABLE'

export const SETTLEMENT_APPLICATION_DOCUMENT_NOT_FOUND_MESSAGE =
  '정산 신청서를 찾을 수 없습니다.'

/** 503 감사로그 fail-closed — 권한(403)과 다른 카피 */
export const SETTLEMENT_APPLICATION_DOCUMENT_AUDIT_UNAVAILABLE_MESSAGE =
  '보안 기록을 저장할 수 없어 정산 신청서를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'

export const SETTLEMENT_APPLICATION_DOCUMENT_LOAD_FAILED_MESSAGE =
  '정산 신청서를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'

function extractApiErrorCode(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null
  const body = data as { code?: unknown; error?: { code?: unknown } }
  const nested = body.error?.code
  if (typeof nested === 'string' && nested.trim()) return nested.trim().toUpperCase()
  if (typeof body.code === 'string' && body.code.trim()) return body.code.trim().toUpperCase()
  return null
}

export function getSettlementApplicationDocumentErrorCode(error: unknown): string | null {
  if (!isAxiosError(error)) return null
  return extractApiErrorCode(error.response?.data)
}

export function getSettlementApplicationDocumentErrorMessage(error: unknown): string {
  const code = getSettlementApplicationDocumentErrorCode(error)
  if (code === SETTLEMENT_APPLICATION_DOCUMENT_NOT_FOUND_CODE) {
    return SETTLEMENT_APPLICATION_DOCUMENT_NOT_FOUND_MESSAGE
  }
  if (code === AUDIT_LOG_UNAVAILABLE_CODE) {
    return SETTLEMENT_APPLICATION_DOCUMENT_AUDIT_UNAVAILABLE_MESSAGE
  }
  if (isAxiosError(error) && error.response?.status === 404) {
    return SETTLEMENT_APPLICATION_DOCUMENT_NOT_FOUND_MESSAGE
  }
  if (isAxiosError(error) && error.response?.status === 503) {
    return SETTLEMENT_APPLICATION_DOCUMENT_AUDIT_UNAVAILABLE_MESSAGE
  }
  return SETTLEMENT_APPLICATION_DOCUMENT_LOAD_FAILED_MESSAGE
}
