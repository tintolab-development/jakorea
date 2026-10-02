/**
 * Portal 프로그램 신청 API 거절 코드 → 사용자 문구
 */

import { isAxiosError } from 'axios'

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
  if (typeof body.error?.message === 'string' && body.error.message.trim()) {
    return body.error.message.trim()
  }
  if (typeof body.message === 'string' && body.message.trim()) return body.message.trim()
  return undefined
}

const BLOCKED_REASON_MESSAGES: Record<string, string> = {
  RECRUITMENT_NOT_STARTED: '모집 기간이 아직 시작되지 않았습니다.',
  /** application-options.blockedReason — 모집 종료 */
  RECRUITMENT_CLOSED: '모집이 마감되었습니다.',
  /** PUT draft / POST applications — 모집 종료 (options 코드와 다름) */
  RECRUITMENT_ENDED: '모집이 마감되었습니다.',
  APPLICATION_FORM_NOT_CONFIGURED: '신청 양식이 아직 준비되지 않았습니다.',
  PROGRAM_NOT_APPLICABLE: '현재 신청할 수 없는 프로그램입니다.',
  ORGANIZATION_MEMBERSHIP_REQUIRED: '학교·기관 회원만 신청할 수 있습니다.',
  APPROVED_INSTRUCTOR_REQUIRED: '승인된 강사만 신청할 수 있습니다.',
  MEMBER_NOT_ACTIVE: '활성 회원만 신청할 수 있습니다.',
  APPLICATION_ALREADY_SUBMITTED: '이미 제출한 신청이 있습니다.',
  PREFERRED_SCHEDULE_OUTSIDE_EDUCATION_RANGE:
    '희망 교육일이 프로그램 교육 가능 기간을 벗어났습니다.',
  PREFERRED_SCHEDULE_EXCEEDS_MAX_SESSIONS_PER_DAY:
    '하루 최대 수업 시수를 초과했습니다.',
  VALIDATION_FAILED: '필수 항목을 모두 입력해 주세요.',
  OPERATION_NOT_ALLOWED: '제출할 수 없는 답변이 포함되어 있습니다.',
  RECRUITMENT_FORM_BINDING_MISMATCH: '선택한 모집의 신청서가 아닙니다. 모집을 다시 선택해 주세요.',
  RECRUITMENT_NOT_FOUND: '선택한 모집을 찾을 수 없습니다. 모집을 다시 선택해 주세요.',
}

export function messageForApplicationBlockedReason(
  reason: string | null | undefined,
): string | null {
  if (!reason?.trim()) return null
  const key = reason.trim().toUpperCase()
  return BLOCKED_REASON_MESSAGES[key] ?? `신청할 수 없습니다. (${reason})`
}

export function getProgramApplicationApiErrorMessage(
  error: unknown,
  fallback = '신청 제출에 실패했습니다. 잠시 후 다시 시도해 주세요.',
): string {
  if (!isAxiosError(error)) return fallback
  const data = error.response?.data
  const code = extractErrorCode(data)
  if (code && BLOCKED_REASON_MESSAGES[code]) {
    return BLOCKED_REASON_MESSAGES[code]
  }
  const message = extractErrorMessage(data)
  if (message) return message
  return fallback
}

export function getApplicationApiErrorCode(error: unknown): string | null {
  if (!isAxiosError(error)) return null
  return extractErrorCode(error.response?.data) ?? null
}
