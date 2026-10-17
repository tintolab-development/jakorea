/**
 * Portal 프로그램 신청 API 거절 코드 → 사용자 문구
 */

import { isAxiosError } from 'axios'
import { PROGRAM_APPLY_REQUIRED_INCOMPLETE_ALERT_MESSAGE } from './program-apply-messages.ts'

function extractErrorCode(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined
  const body = data as { code?: unknown; error?: { code?: unknown; message?: unknown } }
  const nested = body.error?.code
  if (typeof nested === 'string' && nested.trim()) return nested.trim().toUpperCase()
  if (typeof body.code === 'string' && body.code.trim()) return body.code.trim().toUpperCase()
  return undefined
}

function extractErrorMessage(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined
  const body = data as { message?: unknown; error?: { message?: unknown } }
  if (typeof body.message === 'string' && body.message.trim()) {
    return body.message.trim()
  }
  if (typeof body.error?.message === 'string' && body.error.message.trim()) {
    return body.error.message.trim()
  }
  return undefined
}

export const DEFAULT_PROGRAM_APPLICATION_REQUEST_ERROR_MESSAGE =
  '요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'

function normalizeLegacyEnglishApplicationMessage(message: string): string {
  if (
    message.includes('before the program period') ||
    message.includes('after the program period')
  ) {
    return '희망 교육일이 프로그램 운영 기간을 벗어났습니다.'
  }
  if (message.includes('stale or unavailable schedule')) {
    return '선택할 수 없는 교육 일정입니다. 일정을 다시 확인해 주세요.'
  }
  if (message.includes('outside the education schedule periods')) {
    return '희망 교육일이 선택 가능한 교육 예정일 구간을 벗어났습니다.'
  }
  return message
}

export function getApiErrorMessageFromBody(
  data: unknown,
  fallback = DEFAULT_PROGRAM_APPLICATION_REQUEST_ERROR_MESSAGE,
): string {
  const message = extractErrorMessage(data)
  if (message) return normalizeLegacyEnglishApplicationMessage(message)
  const code = extractErrorCode(data)
  if (code && BLOCKED_REASON_MESSAGES[code]) {
    return BLOCKED_REASON_MESSAGES[code]
  }
  return fallback
}

const BLOCKED_REASON_MESSAGES: Record<string, string> = {
  RECRUITMENT_NOT_STARTED: '모집 기간이 아직 시작되지 않았습니다.',
  /** application-options.blockedReason — 모집 종료 */
  RECRUITMENT_CLOSED: '모집이 마감되었습니다.',
  /** PUT draft / POST applications — 모집 종료 (options 코드와 다름) */
  RECRUITMENT_ENDED: '모집이 마감되었습니다.',
  /** CMS 신청 양식 미설정 — URL/파싱 오류가 아님 */
  APPLICATION_FORM_NOT_CONFIGURED:
    '신청 양식이 아직 준비되지 않았습니다. 잠시 후 다시 시도하거나 관리자에게 문의해 주세요.',
  PROGRAM_NOT_APPLICABLE: '현재 신청할 수 없는 프로그램입니다.',
  /** POST 403 — options ORGANIZATION_MEMBERSHIP_REQUIRED 와 쌍 */
  ACTIVE_ORGANIZATION_AFFILIATION_REQUIRED: '활성 학교·기관 소속이 필요합니다.',
  APPLICATION_TYPE_NOT_ALLOWED: '해당 모집에 허용되지 않은 지원 유형입니다.',
  RECRUITMENT_NOT_OPEN: '현재 신청할 수 없는 모집입니다.',
  ORGANIZATION_MEMBERSHIP_REQUIRED: '학교·기관 회원만 신청할 수 있습니다.',
  APPROVED_INSTRUCTOR_REQUIRED: '승인된 강사만 신청할 수 있습니다.',
  MEMBER_NOT_ACTIVE: '활성 회원만 신청할 수 있습니다.',
  APPLICATION_ALREADY_SUBMITTED: '이미 제출한 신청이 있습니다.',
  /** application-options.blockedReason — APPLICATION_ALREADY_SUBMITTED와 동일 안내 */
  ALREADY_APPLIED: '이미 제출한 신청이 있습니다.',
  PREFERRED_SCHEDULE_OUTSIDE_EDUCATION_RANGE:
    '희망 교육일이 프로그램 교육 가능 기간을 벗어났습니다.',
  OUTSIDE_EDUCATION_SCHEDULE_PERIODS:
    '희망 교육일이 선택 가능한 교육 예정일 구간을 벗어났습니다.',
  PREFERRED_SCHEDULE_EXCEEDS_MAX_SCHEDULE_COUNT:
    '선택 가능한 희망 교육 일정 수를 초과했습니다.',
  ORGANIZATION_REQUESTED_SCHEDULE_REQUIRED:
    '진행 희망 교육 일정을 한 개 이상 선택해 주세요.',
  /** 토큰은 인정됐으나 운영 일정으로 materialize 실패 (BE ProgramFormRuntimeSubmissionValidator) */
  INVALID_SCHEDULE_OPTION_TOKEN:
    '선택한 교육 일정을 더 이상 사용할 수 없습니다. 일정을 다시 선택해 주세요.',
  PREFERRED_SCHEDULE_EXCEEDS_MAX_SESSIONS_PER_DAY:
    '하루 최대 수업 시수를 초과했습니다.',
  VALIDATION_FAILED: PROGRAM_APPLY_REQUIRED_INCOMPLETE_ALERT_MESSAGE,
  OPERATION_NOT_ALLOWED: '제출할 수 없는 답변이 포함되어 있습니다.',
  RECRUITMENT_FORM_BINDING_MISMATCH: '선택한 모집의 신청서가 아닙니다. 모집을 다시 선택해 주세요.',
  RECRUITMENT_NOT_FOUND: '선택한 모집을 찾을 수 없습니다. 모집을 다시 선택해 주세요.',
  /**
   * 봉사자 신청 — volunteerTargets 코드와 회원 구분(재학·학교급)이 겹치지 않음.
   * application-options · 폼 조회 · 임시저장 · 제출 모두 HTTP 403.
   */
  VOLUNTEER_RECRUITMENT_TARGET_MISMATCH:
    '모집 대상과 회원 구분이 일치하지 않아 신청할 수 없습니다.',
  COLLEGE_STUDENT_REQUIRED:
    '대학생 모집 프로그램은 재학 중인 대학생 회원만 신청할 수 있습니다.',
  CAPACITY_FULL: '모집 정원이 마감되었습니다.',
  /** POST 409 — options PROGRAM_NOT_APPLICABLE */
  PROGRAM_NOT_ACCEPTING_APPLICATIONS: '현재 신청할 수 없는 프로그램입니다.',
  /** POST 409 — options CAPACITY_FULL */
  RECRUITMENT_CAPACITY_FULL: '모집 정원이 마감되었습니다.',
  /** POST 409 — options APPLICATION_FORM_NOT_CONFIGURED */
  APPLICATION_FORM_NOT_AVAILABLE:
    '신청 양식이 아직 준비되지 않았습니다. 잠시 후 다시 시도하거나 관리자에게 문의해 주세요.',
  /** 개인 프로그램 — 재학(ENROLLED)인데 회원 프로필 학년 없음 (POST; options SSOT 아님) */
  INDIVIDUAL_APPLICATION_ENROLLED_GRADE_REQUIRED:
    '재학 중인 회원은 학년 정보를 등록한 후 개인 프로그램에 신청할 수 있습니다.',
}

export const INDIVIDUAL_APPLICATION_ENROLLED_GRADE_REQUIRED_CODE =
  'INDIVIDUAL_APPLICATION_ENROLLED_GRADE_REQUIRED'

export function messageForApplicationBlockedReason(
  reason: string | null | undefined,
): string | null {
  if (!reason?.trim()) return null
  const key = reason.trim().toUpperCase()
  return BLOCKED_REASON_MESSAGES[key] ?? DEFAULT_PROGRAM_APPLICATION_REQUEST_ERROR_MESSAGE
}

export function getProgramApplicationApiErrorMessage(
  error: unknown,
  fallback = '신청 제출에 실패했습니다. 잠시 후 다시 시도해 주세요.',
): string {
  if (!isAxiosError(error)) return fallback
  return getApiErrorMessageFromBody(error.response?.data, fallback)
}

export function resolveApplicationBlockedDisplayMessage(
  reason: string | null | undefined,
  apiError?: unknown,
): string | null {
  if (apiError) {
    return getProgramApplicationApiErrorMessage(
      apiError,
      messageForApplicationBlockedReason(reason) ??
        DEFAULT_PROGRAM_APPLICATION_REQUEST_ERROR_MESSAGE,
    )
  }
  return messageForApplicationBlockedReason(reason)
}

export function getApplicationApiErrorCode(error: unknown): string | null {
  if (!isAxiosError(error)) return null
  return extractErrorCode(error.response?.data) ?? null
}

export function isIndividualApplicationEnrolledGradeRequiredError(error: unknown): boolean {
  return getApplicationApiErrorCode(error) === INDIVIDUAL_APPLICATION_ENROLLED_GRADE_REQUIRED_CODE
}
