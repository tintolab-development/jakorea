import {
  extractApiErrorCode,
  extractApiErrorMessage,
  type ApiErrorEnvelope,
} from '@/shared/lib/extract-api-error-message'

const BUSINESS_AREA_NOT_FOUND_MESSAGE =
  '등록되지 않은 사업 분야입니다. 마스터에 있는 사업 분야를 선택해 주세요.'

const DATA_MANAGEMENT_ERROR_CODE_MESSAGES: Record<string, string> = {
  SPONSOR_SPONSORSHIP_STATUS_UNSUPPORTED:
    '지원하지 않는 후원 상태입니다. 후원 중·논의중·휴면·종료 중 하나를 선택해 주세요.',
  TEXTBOOK_BUSINESS_AREA_NOT_FOUND: BUSINESS_AREA_NOT_FOUND_MESSAGE,
  /** 구형 BE 코드 — 동일 필드로 처리 */
  UNKNOWN_BUSINESS_AREA_NAME: BUSINESS_AREA_NOT_FOUND_MESSAGE,
}

const BUSINESS_AREA_ERROR_CODES = new Set([
  'TEXTBOOK_BUSINESS_AREA_NOT_FOUND',
  'UNKNOWN_BUSINESS_AREA_NAME',
])

function readAxiosErrorData(error: unknown): unknown {
  if (!error || typeof error !== 'object' || !('response' in error)) return undefined
  return (error as { response?: { data?: unknown } }).response?.data
}

function extractApiErrorField(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined
  const field = (data as ApiErrorEnvelope).error?.field
  return typeof field === 'string' && field.trim() ? field.trim() : undefined
}

export function getDataManagementApiErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosErr = error as { response?: { status?: number; data?: unknown } }
    if (axiosErr.response?.status === 403) {
      return '데이터 관리 조회 권한이 없습니다. 관리자 계정으로 다시 로그인해 주세요.'
    }

    const code = extractApiErrorCode(axiosErr.response?.data)
    const mapped = code ? DATA_MANAGEMENT_ERROR_CODE_MESSAGES[code] : undefined
    if (mapped) {
      const serverMessage = extractApiErrorMessage(axiosErr.response?.data, {
        httpStatus: axiosErr.response?.status,
        fallback: '',
      }).trim()
      // envelope에 message 없이 code만 있으면 extract가 code 문자열을 반환한다 → 한글 매핑 사용
      if (!serverMessage || serverMessage === code) return mapped
      return serverMessage
    }

    return extractApiErrorMessage(axiosErr.response?.data, {
      httpStatus: axiosErr.response?.status,
      fallback:
        axiosErr.response?.status === 409
          ? '요청한 변경이 기존 데이터와 충돌합니다. 참조 중인 항목은 삭제할 수 없습니다.'
          : fallback,
    })
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }
  return fallback
}

/** 세부 프로그램 등록 — businessArea 필드 에러 (마스터 미존재) */
export function getDetailedProgramBusinessAreaFieldError(error: unknown): string | null {
  const data = readAxiosErrorData(error)
  const code = extractApiErrorCode(data)
  const field = extractApiErrorField(data)
  if (code && BUSINESS_AREA_ERROR_CODES.has(code)) {
    return getDataManagementApiErrorMessage(error, BUSINESS_AREA_NOT_FOUND_MESSAGE)
  }
  if (field === 'businessArea') {
    return getDataManagementApiErrorMessage(error, BUSINESS_AREA_NOT_FOUND_MESSAGE)
  }
  return null
}
