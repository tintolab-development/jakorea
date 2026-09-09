import {
  extractApiErrorCode,
  extractApiErrorMessage,
} from '@/shared/lib/extract-api-error-message'

const MEMBER_ERROR_CODE_MESSAGES: Record<string, string> = {
  CMS_INDIVIDUAL_GRADE_REQUIRED_WHEN_ENROLLED:
    '재학 중일 때는 학년을 입력해 주세요.',
  CMS_INDIVIDUAL_SCHOOL_NOT_ALLOWED_WHEN_NOT_ENROLLED:
    '미재학 상태에서는 학교 소속을 선택할 수 없습니다.',
}

export function getMemberApiErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosErr = error as { response?: { status?: number; data?: unknown } }
    if (axiosErr.response?.status === 403) {
      return '회원 관리 조회 권한이 없습니다. 관리자 계정으로 다시 로그인해 주세요.'
    }

    const code = extractApiErrorCode(axiosErr.response?.data)
    const mapped = code ? MEMBER_ERROR_CODE_MESSAGES[code] : undefined
    if (mapped) {
      const serverMessage = extractApiErrorMessage(axiosErr.response?.data, {
        httpStatus: axiosErr.response?.status,
        fallback: '',
      }).trim()
      if (!serverMessage || serverMessage === code) return mapped
      return serverMessage
    }

    const extracted = extractApiErrorMessage(axiosErr.response?.data, {
      httpStatus: axiosErr.response?.status,
      fallback,
    })
    if (extracted) return extracted
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }
  return fallback
}
