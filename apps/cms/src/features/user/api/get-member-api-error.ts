import { messageForProtectedDownloadErrorCode } from '@jakorea/domain/shared/file-download-password'
import {
  extractApiErrorCode,
  extractApiErrorField,
  extractApiErrorMessage,
  readApiErrorEnvelopeText,
} from '@/shared/lib/extract-api-error-message'
import { getNotificationTimingApiErrorMessage } from '@/shared/lib/notification-schedule'
import {
  LECTURE_REPORT_NO_DOWNLOADABLE_FILES,
  LECTURE_REPORT_NO_DOWNLOADABLE_FILES_MESSAGE,
} from '@/shared/lib/lecture-report-bulk-download'

/** BE가 code별 구체 메시지 대신 쓰는 공통 409 문구 — FE 매핑이 있으면 이를 덮어쓴다 */
const GENERIC_CONFLICT_API_MESSAGE =
  '현재 데이터 또는 처리 상태와 충돌하여 요청을 완료할 수 없습니다.'

export const MEMBER_DELETE_CURRENT_PASSWORD_INVALID_CODE =
  'CMS_MEMBER_DELETE_CURRENT_PASSWORD_INVALID'

export const MEMBER_DELETE_CURRENT_PASSWORD_INVALID_ALERT_TITLE = '비밀번호 불일치 안내'

export const MEMBER_DELETE_CURRENT_PASSWORD_INVALID_ALERT_CONTENT =
  '현재 비밀번호가 일치하지 않습니다.\n비밀번호를 확인 후 다시 시도해 주세요.'

const MEMBER_ERROR_CODE_MESSAGES: Record<string, string> = {
  CMS_INDIVIDUAL_GRADE_REQUIRED_WHEN_ENROLLED: '재학 중일 때는 학년을 입력해 주세요.',
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
  /** 강사 권한 종료·승인 취소 — 진행/배정 중 프로그램이 있으면 BE 409 */
  INSTRUCTOR_REVOKE_BLOCKED_BY_ACTIVE_PROGRAM:
    '참여 중인 프로그램이 있어 권한을 취소할 수 없습니다.',
  ADMIN_APPROVAL_CANCEL_HAS_PROGRAM_ASSIGNMENT_HISTORY:
    '프로그램 담당 이력이 있어 승인을 취소할 수 없습니다.',
  /** CMS 회원 삭제 — 관리자 현재 비밀번호 불일치 */
  CMS_MEMBER_DELETE_CURRENT_PASSWORD_INVALID: MEMBER_DELETE_CURRENT_PASSWORD_INVALID_ALERT_CONTENT,
  SETTLEMENT_ACCOUNT_UPDATE_VIA_CONSENT_ONLY:
    '정산 계좌는 지급조서 사전 동의서에서만 입력·수정할 수 있습니다.',
  [LECTURE_REPORT_NO_DOWNLOADABLE_FILES]: LECTURE_REPORT_NO_DOWNLOADABLE_FILES_MESSAGE,
  /**
   * 회원 등록·수정 생년월일 범위 (QA-0220) — 서버 문구와 같다. 서버 원문이 비었을 때만 쓴다.
   * `BIRTH_DATE_TOO_OLD`(120세 초과)는 문구 기획 확인 대기라 매핑하지 않고 서버 원문·공통 문구를 그대로 쓴다.
   */
  BIRTH_DATE_FUTURE_NOT_ALLOWED: '생년월일은 오늘 이후 날짜로 입력할 수 없습니다.',
  /** 본인인증 완료 회원의 성별·생년월일 CMS 수정 차단 (409, QA-0220) — 서버 문구와 같다 */
  CMS_MEMBER_PROFILE_NOT_EDITABLE_AFTER_MEMBER_VERIFICATION:
    '본인확인을 완료한 회원의 본인 소유 개인정보는 CMS에서 수정할 수 없습니다.',
}

/**
 * 성범죄 경력 조회 동의서 서명 원본 연결 실패 (회원/강사 등록 termsAgreements, BE 2026-11-14).
 * 서버 기본 문구(포털 회원 기준 「본인이 업로드한 … PDF만」)는 관리자 화면에 맞지 않아 코드별 FE 문구로 덮어쓴다.
 * `CONSENT_ORIGINAL_FILE_ALREADY_LINKED`는 회원 상세 PATCH에서 재동의로 처리되어 더 이상 나오지 않으므로 매핑하지 않는다.
 */
const CRIME_CONSENT_ORIGINAL_ERROR_MESSAGES: Record<string, string> = {
  CONSENT_EVIDENCE_FILE_NOT_ALLOWED:
    '성범죄 경력 조회 동의서 원본 파일만 첨부할 수 있습니다. 동의서 파일을 다시 첨부해 주세요.',
  CONSENT_ORIGINAL_FILE_NOT_READY:
    '첨부한 동의서 파일을 아직 사용할 수 없습니다. 잠시 후 다시 등록하거나 동의서 파일을 다시 첨부해 주세요.',
  CONSENT_ORIGINAL_FILE_ALREADY_USED:
    '이미 다른 동의서에 연결된 파일입니다. 동의서 파일을 다시 첨부해 주세요.',
}

/** 성범죄 동의서 원본 연결 오류면 FE 안내 문구, 아니면 null */
export function getCrimeConsentOriginalErrorMessage(error: unknown): string | null {
  if (!error || typeof error !== 'object' || !('response' in error)) return null
  const code = extractApiErrorCode((error as { response?: { data?: unknown } }).response?.data)
  return (code && CRIME_CONSENT_ORIGINAL_ERROR_MESSAGES[code]) || null
}

export function isMemberDeleteCurrentPasswordInvalidError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosErr = error as { response?: { data?: unknown } }
    return (
      extractApiErrorCode(axiosErr.response?.data) === MEMBER_DELETE_CURRENT_PASSWORD_INVALID_CODE
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
    const code = extractApiErrorCode(axiosErr.response?.data)
    const protectedDownloadMessage = messageForProtectedDownloadErrorCode(code)
    if (protectedDownloadMessage) {
      const serverMessage = extractApiErrorMessage(axiosErr.response?.data, {
        httpStatus: axiosErr.response?.status,
        fallback: '',
      }).trim()
      return serverMessage || protectedDownloadMessage
    }
    if (code === 'PERMISSION_DENIED' || code === 'RESOURCE_SCOPE_DENIED') {
      const serverMessage = extractApiErrorMessage(axiosErr.response?.data, {
        httpStatus: axiosErr.response?.status,
        fallback: '',
      }).trim()
      return serverMessage || '파일 다운로드 권한이 없습니다.'
    }
    if (axiosErr.response?.status === 403) {
      return '회원 관리 조회 권한이 없습니다. 관리자 계정으로 다시 로그인해 주세요.'
    }
    if (code === MEMBER_DELETE_CURRENT_PASSWORD_INVALID_CODE) {
      return MEMBER_DELETE_CURRENT_PASSWORD_INVALID_ALERT_CONTENT
    }
    const crimeConsentOriginalMessage = getCrimeConsentOriginalErrorMessage(error)
    if (crimeConsentOriginalMessage) return crimeConsentOriginalMessage
    if (code === 'PORTRAIT_CONSENT_CONTENT_UNAVAILABLE') {
      return '초상권 동의 상태는 유지되지만 보존 정책 또는 작성 내용 부재로 제출 작성본을 조회할 수 없습니다.'
    }
    const mapped = code ? MEMBER_ERROR_CODE_MESSAGES[code] : undefined
    if (mapped) {
      // 서버 원문만 본다. extractApiErrorMessage는 원문이 없으면 상태코드 공통 문구를 돌려주므로
      // (17a5231ee 이후 code 반환 제거) 그 값으로 비교하면 FE 매핑이 가려진다.
      const serverMessage = readApiErrorEnvelopeText(axiosErr.response?.data)?.trim() ?? ''
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

/**
 * 회원·관리자 기본정보 저장 — 서버 `error.field === 'email'`이면 이메일 입력란에 보일 문구(서버 message 그대로).
 * 예: `EMAIL_ALREADY_EXISTS`·`INVALID_EMAIL`·`EMAIL_CHANGE_NOT_ALLOWED`. 이메일 필드 에러가 아니면 null.
 */
export function getMemberApiEmailFieldErrorMessage(error: unknown): string | null {
  if (!error || typeof error !== 'object' || !('response' in error)) return null
  const response = (error as { response?: { status?: number; data?: unknown } }).response
  if (extractApiErrorField(response?.data) !== 'email') return null
  const message = readApiErrorEnvelopeText(response?.data)?.trim()
  return message || null
}
