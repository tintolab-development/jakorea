/**
 * GENERAL_ORGANIZATION 강사 승인·배정 — 기관-일정 스코프 409 처리.
 *
 * 기획 SSOT: 승인 기관의 희망 일정(+ resolvedScheduleId)이 배정 원천이며,
 * OSA 선배정은 필수가 아니다. FE는 OSA로 후보를 사전 필터하지 않는다.
 *
 * @see JABACK/docs/frontend/general-instructor-approve-preferred-schedule-scope-frontend-handoff-2026-10-09.md
 */

import {
  extractApiErrorMessage,
  getApiErrorCode,
  getApiErrorHttpStatus,
} from '@/shared/lib/extract-api-error-message'

export const INSTRUCTOR_ORGANIZATION_SCHEDULE_SCOPE_INVALID =
  'INSTRUCTOR_ORGANIZATION_SCHEDULE_SCOPE_INVALID'

export const INSTRUCTOR_ORGANIZATION_CONTEXT_REQUIRED =
  'INSTRUCTOR_ORGANIZATION_CONTEXT_REQUIRED'

export const ORGANIZATION_CONTEXT_GUIDE =
  '같은 일정에 여러 기관이 있어 강사를 배정할 기관을 선택해 주세요.'

/**
 * 409 fallback — 서버 message가 없을 때만 사용. OSA 선배정 UI로 유도하지 않는다.
 * @see general-instructor-approve-preferred-schedule-scope-frontend-handoff-2026-10-09.md
 */
export const ORGANIZATION_SCHEDULE_SCOPE_GUIDE =
  '선택한 기관의 승인된 희망 교육 일정과 일치하지 않습니다. 기관의 교육 일정 확정 후 다시 배정해 주세요.'

/**
 * 409 `INSTRUCTOR_ORGANIZATION_SCHEDULE_SCOPE_INVALID` 이면 서버 message 우선, 아니면 null.
 * OSA 선배정 화면으로 보내는 고정 안내는 쓰지 않는다.
 */
export function formatInstructorOrganizationScheduleScopeMessage(error: unknown): string | null {
  if (getApiErrorCode(error) !== INSTRUCTOR_ORGANIZATION_SCHEDULE_SCOPE_INVALID) return null
  const data =
    error && typeof error === 'object' && 'response' in error
      ? (error as { response?: { data?: unknown } }).response?.data
      : undefined
  const serverMessage = extractApiErrorMessage(data, {
    httpStatus: getApiErrorHttpStatus(error),
    fallback: ORGANIZATION_SCHEDULE_SCOPE_GUIDE,
  }).trim()
  return serverMessage || ORGANIZATION_SCHEDULE_SCOPE_GUIDE
}

export function formatInstructorOrganizationContextRequiredMessage(
  error: unknown
): string | null {
  if (getApiErrorCode(error) !== INSTRUCTOR_ORGANIZATION_CONTEXT_REQUIRED) return null
  const data =
    error && typeof error === 'object' && 'response' in error
      ? (error as { response?: { data?: unknown } }).response?.data
      : undefined
  const serverMessage = extractApiErrorMessage(data, {
    httpStatus: getApiErrorHttpStatus(error),
    fallback: ORGANIZATION_CONTEXT_GUIDE,
  }).trim()
  return serverMessage || ORGANIZATION_CONTEXT_GUIDE
}

/** 강사 승인·배정 API 409 — 기관-일정 스코프·기관 선택 필수 */
export function formatInstructorOrganizationApprovalErrorMessage(
  error: unknown
): string | null {
  return (
    formatInstructorOrganizationScheduleScopeMessage(error) ??
    formatInstructorOrganizationContextRequiredMessage(error)
  )
}
