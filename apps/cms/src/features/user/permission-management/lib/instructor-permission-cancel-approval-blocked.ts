import { getApiErrorCode } from '@/shared/lib/extract-api-error-message'
import { INSTRUCTOR_PERMISSION_REVOKE_BLOCKED_ALERT } from '@/features/user/detail/lib/instructor-permission-revoke-copy'
import { INSTRUCTOR_PERMISSION_CANCEL_APPROVAL_BLOCKED_ALERT } from './instructor-permission-cancel-approval-copy'

/** BE 409 `error.code` — 진행 중 프로그램이 있으면 강사 권한 회수·승인 취소를 차단 */
export const INSTRUCTOR_REVOKE_BLOCKED_BY_ACTIVE_PROGRAM_CODE =
  'INSTRUCTOR_REVOKE_BLOCKED_BY_ACTIVE_PROGRAM'

const INSTRUCTOR_ROLE_REQUEST_CANCEL_APPROVAL_PATH =
  /\/instructor-role-requests\/[^/?#]+\/cancel-approval(?:[/?#]|$)/

const INSTRUCTOR_REVOKE_PATH = /\/instructors\/[^/?#]+\/revoke(?:[/?#]|$)/

export function isInstructorRevokeBlockedByActiveProgramError(error: unknown): boolean {
  return getApiErrorCode(error) === INSTRUCTOR_REVOKE_BLOCKED_BY_ACTIVE_PROGRAM_CODE
}

/** 강사 권한 신청 승인 취소 API만. 관리자 승인 취소·프로그램 신청 취소와 구분한다. */
export function isInstructorRoleRequestCancelApprovalUrl(url: string | undefined | null): boolean {
  if (!url) return false
  return INSTRUCTOR_ROLE_REQUEST_CANCEL_APPROVAL_PATH.test(url)
}

/** 회원 상세 강사 권한 종료(revoke) API만. 승인 취소와 구분한다. */
export function isInstructorRevokeUrl(url: string | undefined | null): boolean {
  if (!url) return false
  return INSTRUCTOR_REVOKE_PATH.test(url)
}

export function shouldSkipGlobalAlertForInstructorCancelApprovalBlocked(
  error: unknown,
  url?: string | null
): boolean {
  return (
    isInstructorRevokeBlockedByActiveProgramError(error) &&
    isInstructorRoleRequestCancelApprovalUrl(url)
  )
}

export function shouldSkipGlobalAlertForInstructorRevokeBlocked(
  error: unknown,
  url?: string | null
): boolean {
  return isInstructorRevokeBlockedByActiveProgramError(error) && isInstructorRevokeUrl(url)
}

export function resolveInstructorCancelApprovalBlockedAlert(error: unknown) {
  if (!isInstructorRevokeBlockedByActiveProgramError(error)) return null
  return INSTRUCTOR_PERMISSION_CANCEL_APPROVAL_BLOCKED_ALERT
}

export function resolveInstructorRevokeBlockedAlert(error: unknown) {
  if (!isInstructorRevokeBlockedByActiveProgramError(error)) return null
  return INSTRUCTOR_PERMISSION_REVOKE_BLOCKED_ALERT
}
