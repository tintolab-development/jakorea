import { describe, expect, it } from 'vitest'
import { getMemberApiErrorMessage } from '@/features/user/api/get-member-api-error'
import { INSTRUCTOR_PERMISSION_REVOKE_BLOCKED_ALERT } from '@/features/user/detail/lib/instructor-permission-revoke-copy'
import {
  INSTRUCTOR_REVOKE_BLOCKED_BY_ACTIVE_PROGRAM_CODE,
  isInstructorRevokeBlockedByActiveProgramError,
  isInstructorRevokeUrl,
  isInstructorRoleRequestCancelApprovalUrl,
  resolveInstructorCancelApprovalBlockedAlert,
  resolveInstructorRevokeBlockedAlert,
  shouldSkipGlobalAlertForInstructorCancelApprovalBlocked,
  shouldSkipGlobalAlertForInstructorRevokeBlocked,
} from './instructor-permission-cancel-approval-blocked'
import { INSTRUCTOR_PERMISSION_CANCEL_APPROVAL_BLOCKED_ALERT } from './instructor-permission-cancel-approval-copy'

const GENERIC_CONFLICT_MESSAGE = '현재 데이터 또는 처리 상태와 충돌하여 요청을 완료할 수 없습니다.'

function axiosEnvelopeError(input: {
  status: number
  code?: string
  message?: string
  details?: null
  url?: string
}) {
  return {
    response: {
      status: input.status,
      data: {
        success: false,
        data: null,
        message: input.message ?? GENERIC_CONFLICT_MESSAGE,
        error: {
          code: input.code,
          message: input.message ?? GENERIC_CONFLICT_MESSAGE,
          field: null,
          details: input.details === undefined ? null : input.details,
        },
      },
    },
    config: { url: input.url, method: 'post' },
  }
}

const CANCEL_APPROVAL_URL = '/api/admin/instructor-role-requests/42/cancel-approval'
const REVOKE_URL = '/api/admin/instructors/42/revoke'
const ADMIN_CANCEL_URL = '/api/admin/admin-approval-requests/42/cancel-approval'

describe('instructor cancel-approval blocked-by-active-program', () => {
  it('T01/T06/T07: 대상 코드면 전용 안내 문구를 쓰고 서버 message는 쓰지 않는다', () => {
    const error = axiosEnvelopeError({
      status: 409,
      code: INSTRUCTOR_REVOKE_BLOCKED_BY_ACTIVE_PROGRAM_CODE,
      details: null,
      url: CANCEL_APPROVAL_URL,
    })

    expect(isInstructorRevokeBlockedByActiveProgramError(error)).toBe(true)
    expect(resolveInstructorCancelApprovalBlockedAlert(error)).toEqual(
      INSTRUCTOR_PERMISSION_CANCEL_APPROVAL_BLOCKED_ALERT
    )
    expect(INSTRUCTOR_PERMISSION_CANCEL_APPROVAL_BLOCKED_ALERT.title).toBe(
      '강사 권한 승인 취소 불가 안내'
    )
    expect(INSTRUCTOR_PERMISSION_CANCEL_APPROVAL_BLOCKED_ALERT.content).toBe(
      [
        '해당 회원은 현재 진행 중인 프로그램이 있습니다.',
        '진행 중인 프로그램이 있는 경우, 강사 권한 승인 취소가 불가합니다.',
      ].join('\n')
    )
    expect(INSTRUCTOR_PERMISSION_CANCEL_APPROVAL_BLOCKED_ALERT.confirmLabel).toBe('확인')
    expect(INSTRUCTOR_PERMISSION_CANCEL_APPROVAL_BLOCKED_ALERT.content).not.toBe(
      GENERIC_CONFLICT_MESSAGE
    )
  })

  it('T02: 일반 409 충돌 코드는 전용 팝업을 쓰지 않는다', () => {
    const error = axiosEnvelopeError({
      status: 409,
      code: 'INSTRUCTOR_APPROVAL_CANCEL_STATE_CHANGED',
      url: CANCEL_APPROVAL_URL,
    })
    expect(isInstructorRevokeBlockedByActiveProgramError(error)).toBe(false)
    expect(resolveInstructorCancelApprovalBlockedAlert(error)).toBeNull()
    expect(
      shouldSkipGlobalAlertForInstructorCancelApprovalBlocked(error, CANCEL_APPROVAL_URL)
    ).toBe(false)
  })

  it('T03: INVALID_NOTIFICATION_SCHEDULE은 전용 팝업을 쓰지 않는다', () => {
    const error = axiosEnvelopeError({
      status: 400,
      code: 'INVALID_NOTIFICATION_SCHEDULE',
      message: '예약 발송 시각이 올바르지 않습니다.',
      url: CANCEL_APPROVAL_URL,
    })
    expect(resolveInstructorCancelApprovalBlockedAlert(error)).toBeNull()
    expect(getMemberApiErrorMessage(error, 'fallback')).not.toContain('승인 취소가 불가합니다')
  })

  it('T04: 403은 전용 팝업을 쓰지 않는다', () => {
    const error = axiosEnvelopeError({
      status: 403,
      code: 'PERMISSION_DENIED',
      message: '권한이 없습니다.',
      url: CANCEL_APPROVAL_URL,
    })
    expect(resolveInstructorCancelApprovalBlockedAlert(error)).toBeNull()
  })

  it('T05: 500은 전용 팝업을 쓰지 않는다', () => {
    const error = axiosEnvelopeError({
      status: 500,
      code: 'INTERNAL_ERROR',
      message: '서버 오류',
      url: CANCEL_APPROVAL_URL,
    })
    expect(resolveInstructorCancelApprovalBlockedAlert(error)).toBeNull()
  })

  it('message 문자열이 같아도 코드가 다르면 전용 팝업을 쓰지 않는다', () => {
    const error = axiosEnvelopeError({
      status: 409,
      code: 'INSTRUCTOR_APPROVAL_CANCEL_REQUIRES_APPROVED',
      url: CANCEL_APPROVAL_URL,
    })
    expect(isInstructorRevokeBlockedByActiveProgramError(error)).toBe(false)
  })

  it('T15: 관리자 승인 취소 URL은 글로벌 알림을 건너뛰지 않는다', () => {
    const error = axiosEnvelopeError({
      status: 409,
      code: INSTRUCTOR_REVOKE_BLOCKED_BY_ACTIVE_PROGRAM_CODE,
      url: ADMIN_CANCEL_URL,
    })
    expect(isInstructorRoleRequestCancelApprovalUrl(ADMIN_CANCEL_URL)).toBe(false)
    expect(shouldSkipGlobalAlertForInstructorCancelApprovalBlocked(error, ADMIN_CANCEL_URL)).toBe(
      false
    )
  })

  it('T16: 승인 취소 전용 skip은 강사 권한 종료 URL에 적용하지 않는다', () => {
    const error = axiosEnvelopeError({
      status: 409,
      code: INSTRUCTOR_REVOKE_BLOCKED_BY_ACTIVE_PROGRAM_CODE,
      url: REVOKE_URL,
    })
    expect(isInstructorRoleRequestCancelApprovalUrl(REVOKE_URL)).toBe(false)
    expect(shouldSkipGlobalAlertForInstructorCancelApprovalBlocked(error, REVOKE_URL)).toBe(false)
  })

  it('강사 권한 종료 URL + 대상 코드만 종료 전용 안내를 쓰고 글로벌 알림을 건너뛴다', () => {
    const error = axiosEnvelopeError({
      status: 409,
      code: INSTRUCTOR_REVOKE_BLOCKED_BY_ACTIVE_PROGRAM_CODE,
      details: null,
      url: REVOKE_URL,
    })
    expect(isInstructorRevokeUrl(REVOKE_URL)).toBe(true)
    expect(isInstructorRevokeUrl(CANCEL_APPROVAL_URL)).toBe(false)
    expect(shouldSkipGlobalAlertForInstructorRevokeBlocked(error, REVOKE_URL)).toBe(true)
    expect(shouldSkipGlobalAlertForInstructorRevokeBlocked(error, CANCEL_APPROVAL_URL)).toBe(false)
    expect(resolveInstructorRevokeBlockedAlert(error)).toEqual(
      INSTRUCTOR_PERMISSION_REVOKE_BLOCKED_ALERT
    )
    expect(INSTRUCTOR_PERMISSION_REVOKE_BLOCKED_ALERT.content).not.toBe(GENERIC_CONFLICT_MESSAGE)
  })

  it('강사 권한 종료 URL의 일반 409는 전용 안내를 쓰지 않는다', () => {
    const error = axiosEnvelopeError({
      status: 409,
      code: 'INSTRUCTOR_REVOKE_STATE_CHANGED',
      url: REVOKE_URL,
    })
    expect(isInstructorRevokeBlockedByActiveProgramError(error)).toBe(false)
    expect(resolveInstructorRevokeBlockedAlert(error)).toBeNull()
    expect(shouldSkipGlobalAlertForInstructorRevokeBlocked(error, REVOKE_URL)).toBe(false)
  })

  it('승인 취소 URL + 대상 코드만 글로벌 알림을 건너뛴다', () => {
    const error = axiosEnvelopeError({
      status: 409,
      code: INSTRUCTOR_REVOKE_BLOCKED_BY_ACTIVE_PROGRAM_CODE,
      details: null,
      url: CANCEL_APPROVAL_URL,
    })
    expect(isInstructorRoleRequestCancelApprovalUrl(CANCEL_APPROVAL_URL)).toBe(true)
    expect(
      shouldSkipGlobalAlertForInstructorCancelApprovalBlocked(error, CANCEL_APPROVAL_URL)
    ).toBe(true)
    expect(
      shouldSkipGlobalAlertForInstructorCancelApprovalBlocked(
        error,
        '/api/admin/instructor-applications/1/cancel-approval'
      )
    ).toBe(false)
  })
})
