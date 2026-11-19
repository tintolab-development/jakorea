import { AxiosError } from 'axios'
import { describe, expect, it } from 'vitest'
import {
  isAdminLoginApprovalPendingResponse,
  isAdminLoginApprovalPendingError,
} from './admin-login-approval-pending-error'

function axiosError(status: number, data: unknown) {
  return new AxiosError('failed', undefined, undefined, undefined, {
    status,
    statusText: 'Error',
    headers: {},
    config: {} as never,
    data,
  })
}

describe('Homepage Admin approval pending classification', () => {
  it('recognizes explicit backend approval code', () => {
    expect(isAdminLoginApprovalPendingResponse({
      error: { code: 'ACCOUNT_PENDING_APPROVAL' },
    }, 423)).toBe(true)
  })

  it.each([
    ['ACCOUNT_LOCKED', 423],
    ['ACCOUNT_INACTIVE', 423],
    ['LOGIN_DISABLED', 423],
    ['INVALID_CREDENTIALS', 401],
  ])('does not turn %s into approval pending', (code, status) => {
    const body = { error: { code } }
    expect(isAdminLoginApprovalPendingResponse(body, status)).toBe(false)
    expect(isAdminLoginApprovalPendingError(axiosError(status, body))).toBe(false)
  })

  it('does not classify an unstructured 423 as approval pending', () => {
    expect(isAdminLoginApprovalPendingResponse({}, 423)).toBe(false)
  })
})
