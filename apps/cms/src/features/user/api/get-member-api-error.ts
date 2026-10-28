import {
  extractApiErrorCode,
  extractApiErrorMessage,
} from '@/shared/lib/extract-api-error-message'
import { getNotificationTimingApiErrorMessage } from '@/shared/lib/notification-schedule'

/** BE가 code별 구체 메시지 대신 쓰는 공통 409 문구 — FE 매핑이 있으면 이를 덮어쓴다 */
const GENERIC_CONFLICT_API_MESSAGE =
  '현재 데이터 또는 처리 상태와 충돌하여 요청을 완료할 수 없습니다.'

export const MEMBER_DELETE_CURRENT_PASSWORD_INVALID_CODE =
  'CMS_MEMBER_DELETE_CURRENT_PASSWORD_INVALID'

export const MEMBER_DELETE_CURRENT_PASSWORD_INVALID_ALERT_TITLE = '비밀번호 불일치 안내'

export const MEMBER_DELETE_CURRENT_PASSWORD_INVALID_ALERT_CONTENT =
  '현재 비밀번호가 일치하지 않습니다.\n비밀번호를 확인 후 다시 시도해 주세요.'

const MEMBER_ERROR_CODE_MESSAGES: Record<string, string> = {
  CMS_INDIVIDUAL_GRADE_REQUIRED_WHEN_ENROLLED:
    '재학 중일 때는 학년을 입력해 주세요.',
  CMS_INDIVIDUAL_SCHOOL_NOT_ALLOWED_WHEN_NOT_ENROLLED:
    '미재학 상태에서는 학교 소속을 선택할 수 없습니다.',
  INSTRUCTOR_JA_GRADE_POLICY_NOT_INITIALIZED:
    'JA 강사 등급 정책이 설정되지 않았습니다. 관리자에게 문의해 주세요.',
  INSTRUCTOR_APPROVAL_FEE_GRADE_UNSUPPORTED:
    '지원하지 않는 강사비 등급입니다. 1급·2급·3급 중에서 선택해 주세요.',
  INSTRUCTOR_FEE_GRADE_UNSUPPORTED:
    '지원하지 않는 강사비 등급입니다. 1급·2급·3급 중에서 선택해 주세요.',
  CMS_INSTRUCTOR_FEE_GRADE_UNSUPPORTED:
    '지원하지 않는 강사비 등급입니다. 1급·2급·3급 중에서 선택해 주세요.',
  /** 강사 권한 박탈·승인 취소 — 진행/배정 중 프로그램이 있으면 BE 409 */
  INSTRUCTOR_REVOKE_BLOCKED_BY_ACTIVE_PROGRAM:
    '참여 중인 프로그램이 있어 권한을 취소할 수 없습니다.',
  ADMIN_APPROVAL_CANCEL_HAS_PROGRAM_ASSIGNMENT_HISTORY:
    '프로그램 담당 이력이 있어 승인을 취소할 수 없습니다.',
  /** CMS 회원 삭제 — 관리자 현재 비밀번호 불일치 */
  CMS_MEMBER_DELETE_CURRENT_PASSWORD_INVALID:
    MEMBER_DELETE_CURRENT_PASSWORD_INVALID_ALERT_CONTENT,
}

export function isMemberDeleteCurrentPasswordInvalidError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosErr = error as { response?: { data?: unknown } }
    return (
      extractApiErrorCode(axiosErr.response?.data) ===
      MEMBER_DELETE_CURRENT_PASSWORD_INVALID_CODE
    )
  }
  return false
}

export function getMemberDeleteCurrentPasswordInvalidAlertOptions(): {
  title: string
  content: string
} {
  return {
    title: MEMBER_DELETE_CURRENT_PASSWORD_INVALID_ALERT_TITLE,
    content: MEMBER_DELETE_CURRENT_PASSWORD_INVALID_ALERT_CONTENT,
  }
}

export function getMemberApiErrorMessage(error: unknown, fallback: string): string {
  const timingMessage = getNotificationTimingApiErrorMessage(error)
  if (timingMessage) return timingMessage
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosErr = error as { response?: { status?: number; data?: unknown } }
    if (axiosErr.response?.status === 403) {
      return '회원 관리 조회 권한이 없습니다. 관리자 계정으로 다시 로그인해 주세요.'
    }

    const code = extractApiErrorCode(axiosErr.response?.data)
    if (code === MEMBER_DELETE_CURRENT_PASSWORD_INVALID_CODE) {
      return MEMBER_DELETE_CURRENT_PASSWORD_INVALID_ALERT_CONTENT
    }
    if (code === 'PORTRAIT_CONSENT_CONTENT_UNAVAILABLE') {
      return '초상권 동의 상태는 유지되지만 보존 정책 또는 작성 내용 부재로 제출 작성본을 조회할 수 없습니다.'
    }
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
