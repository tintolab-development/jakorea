import { AxiosError } from 'axios'
import { describe, expect, it } from 'vitest'
import {
  ADMIN_LOGIN_APPROVAL_PENDING_MESSAGE,
  AdminLoginApprovalPendingError,
  isAdminLoginApprovalPendingError,
  isAdminLoginApprovalPendingResponse,
} from './admin-login-approval-pending-error'

function createAxiosError(status: number, data: unknown) {
  return new AxiosError('Request failed', undefined, undefined, undefined, {
    status,
    data,
    statusText: 'Error',
    headers: {},
    config: {} as never,
  })
}

describe('isAdminLoginApprovalPendingResponse', () => {
  it('treats HTTP 423 as approval pending even without a code', () => {
    expect(isAdminLoginApprovalPendingResponse({ message: 'Account is inactive' }, 423)).toBe(
      true
    )
  })

  it('matches ACCOUNT_INACTIVE and nested error.code', () => {
    expect(
      isAdminLoginApprovalPendingResponse({ error: { code: 'ACCOUNT_INACTIVE' } }, 403)
    ).toBe(true)
    expect(isAdminLoginApprovalPendingResponse({ code: 'PENDING_VERIFICATION' })).toBe(true)
  })

  it('does not match unrelated login failures', () => {
    expect(
      isAdminLoginApprovalPendingResponse({ error: { code: 'INVALID_CREDENTIALS' } }, 401)
    ).toBe(false)
  })
})

describe('isAdminLoginApprovalPendingError', () => {
  it('returns true for the typed error and axios 423', () => {
    expect(isAdminLoginApprovalPendingError(new AdminLoginApprovalPendingError())).toBe(true)
    expect(
      isAdminLoginApprovalPendingError(
        createAxiosError(423, { error: { code: 'ACCOUNT_INACTIVE', message: 'inactive' } })
      )
    ).toBe(true)
  })

  it('exposes the fixed Korean copy', () => {
    expect(new AdminLoginApprovalPendingError().message).toBe(
      ADMIN_LOGIN_APPROVAL_PENDING_MESSAGE
    )
  })
})

describe('계정 잠금 — 423 이어도 승인 대기로 보지 않는다', () => {
  const lockedDetail = {
    detail:
      '로그인에 여러 번 실패하여 계정이 30분간 잠겼습니다. 잠시 후 다시 시도하거나 관리자에게 문의해 주세요.',
  }

  it('detail 문구가 잠금이면 승인 대기가 아니다', () => {
    expect(isAdminLoginApprovalPendingResponse(lockedDetail, 423)).toBe(false)
    expect(isAdminLoginApprovalPendingError(createAxiosError(423, lockedDetail))).toBe(false)
  })

  it('ACCOUNT_LOCKED 코드면 승인 대기가 아니다', () => {
    expect(
      isAdminLoginApprovalPendingResponse({ error: { code: 'ACCOUNT_LOCKED' } }, 423)
    ).toBe(false)
  })
})
