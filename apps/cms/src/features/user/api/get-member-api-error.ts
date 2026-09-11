import {
  extractApiErrorCode,
  extractApiErrorMessage,
} from '@/shared/lib/extract-api-error-message'

/** BE가 code별 구체 메시지 대신 쓰는 공통 409 문구 — FE 매핑이 있으면 이를 덮어쓴다 */
const GENERIC_CONFLICT_API_MESSAGE =
  '현재 데이터 또는 처리 상태와 충돌하여 요청을 완료할 수 없습니다.'

const MEMBER_ERROR_CODE_MESSAGES: Record<string, string> = {
  CMS_INDIVIDUAL_GRADE_REQUIRED_WHEN_ENROLLED:
    '재학 중일 때는 학년을 입력해 주세요.',
  CMS_INDIVIDUAL_SCHOOL_NOT_ALLOWED_WHEN_NOT_ENROLLED:
    '미재학 상태에서는 학교 소속을 선택할 수 없습니다.',
  INSTRUCTOR_JA_GRADE_POLICY_NOT_INITIALIZED:
    'JA 강사 등급 정책이 설정되지 않았습니다. 관리자에게 문의해 주세요.',
  /** 강사 권한 박탈·승인 취소 — 진행/배정 중 프로그램이 있으면 BE 409 */
  INSTRUCTOR_REVOKE_BLOCKED_BY_ACTIVE_PROGRAM:
    '참여 중인 프로그램이 있어 권한을 취소할 수 없습니다.',
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
      // 공통 409 문구만 온 경우 FE 코드 매핑을 우선한다 (원인 코드가 더 정확)
      if (
        !serverMessage ||
        serverMessage === code ||
        serverMessage === GENERIC_CONFLICT_API_MESSAGE
      ) {
        return mapped
      }
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
