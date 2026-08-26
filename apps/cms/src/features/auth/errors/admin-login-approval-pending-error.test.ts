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
