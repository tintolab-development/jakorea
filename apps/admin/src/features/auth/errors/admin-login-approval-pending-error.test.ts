import { AxiosError } from 'axios'
import { describe, expect, it } from 'vitest'
import {
  isAdminLoginApprovalPendingError,
  isAdminLoginApprovalPendingResponse,
} from './admin-login-approval-pending-error'

function axiosFailure(status: number, data: unknown) {
  return new AxiosError('Request failed', undefined, undefined, undefined, {
    status,
    statusText: 'Error',
    headers: {},
    config: {} as never,
    data,
  })
}

describe('homepage admin login approval errors', () => {
  it('identifies the canonical pending status by error code', () => {
    expect(isAdminLoginApprovalPendingResponse({ error: { code: 'ACCOUNT_PENDING_APPROVAL' } }, 423)).toBe(true)
    expect(isAdminLoginApprovalPendingResponse({ error: { code: 'PENDING_VERIFICATION' } }, 423)).toBe(true)
    expect(isAdminLoginApprovalPendingError(axiosFailure(423, { error: { code: 'ACCOUNT_PENDING_APPROVAL' } }))).toBe(true)
  })

  it('never treats a bare 423 or inactive account as pending approval', () => {
    expect(isAdminLoginApprovalPendingResponse({}, 423)).toBe(false)
    expect(isAdminLoginApprovalPendingResponse({ error: { code: 'ACCOUNT_LOCKED' } }, 423)).toBe(false)
    expect(isAdminLoginApprovalPendingResponse({ error: { code: 'ACCOUNT_INACTIVE' } }, 423)).toBe(false)
    expect(isAdminLoginApprovalPendingResponse({ error: { code: 'LOGIN_DISABLED' } }, 423)).toBe(false)
    expect(isAdminLoginApprovalPendingError(axiosFailure(423, { error: { code: 'ACCOUNT_LOCKED' } }))).toBe(false)
  })

  it('does not treat 401 credentials failure as pending', () => {
    expect(isAdminLoginApprovalPendingResponse({ error: { code: 'INVALID_CREDENTIALS' } }, 401)).toBe(false)
  })
})
