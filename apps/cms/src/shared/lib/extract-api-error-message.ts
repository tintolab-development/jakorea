/** 백엔드 공통 에러 envelope (`success: false`, `error: { code, message, traceId }`) */
export type ApiErrorEnvelope = {
  success?: boolean
  message?: string
  error?: {
    code?: string
    message?: string
    field?: string | null
    traceId?: string
  }
  traceId?: string
}

function asEnvelope(data: unknown): ApiErrorEnvelope | null {
  if (!data || typeof data !== 'object') return null
  return data as ApiErrorEnvelope
}

/**
 * Axios `response.data` 등 백엔드 에러 body에서 사용자 표시용 메시지를 추출합니다.
 * 서버가 내려준 문자열을 **가공하지 않고** 그대로 사용합니다.
 */
export function extractApiErrorMessage(
  data: unknown,
  options?: { httpStatus?: number | null; fallback?: string }
): string {
  const envelope = asEnvelope(data)
  if (envelope) {
    const top = envelope.message?.trim()
    if (top) return top

    const nested = envelope.error?.message?.trim()
    if (nested) return nested

    const code = envelope.error?.code?.trim()
    if (code) return code
  }

  if (typeof data === 'string' && data.trim()) {
    return data.trim()
  }

  const status = options?.httpStatus
  if (status === 403) return '요청에 필요한 권한이 없습니다.'
  if (status === 404) return '요청한 정보를 찾을 수 없습니다.'
  if (status === 409) return '요청한 변경이 기존 데이터와 충돌합니다.'
  if (status != null && status >= 500) return '서버 처리 중 오류가 발생했습니다.'

  return options?.fallback?.trim() || '요청 처리에 실패했습니다.'
}

/** Alert 본문 — 서버 메시지 그대로 (traceId 미포함) */
export function formatApiErrorAlertContent(data: unknown, options?: { httpStatus?: number | null }): string {
  return extractApiErrorMessage(data, options)
}

/** 구조화 오류 코드 (`error.code` 또는 top-level `code`) */
export function extractApiErrorCode(data: unknown): string | undefined {
  const envelope = asEnvelope(data)
  const nested = envelope?.error?.code?.trim()
  if (nested) return nested
  const top = (envelope as { code?: unknown } | null)?.code
  return typeof top === 'string' && top.trim() ? top.trim() : undefined
}

export function getApiErrorHttpStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object' || !('response' in error)) return undefined
  const status = (error as { response?: { status?: number } }).response?.status
  return typeof status === 'number' ? status : undefined
}

export function getApiErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object' || !('response' in error)) return undefined
  const data = (error as { response?: { data?: unknown } }).response?.data
  return extractApiErrorCode(data)
}
