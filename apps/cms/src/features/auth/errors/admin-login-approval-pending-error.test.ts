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
  it('423 + ACCOUNT_PENDING_APPROVAL 이면 승인 대기다', () => {
    expect(
      isAdminLoginApprovalPendingResponse({ error: { code: 'ACCOUNT_PENDING_APPROVAL' } }, 423)
    ).toBe(true)
    expect(isAdminLoginApprovalPendingResponse({ code: 'PENDING_VERIFICATION' })).toBe(true)
  })

  it('423 이어도 code 가 없으면 승인 대기로 보지 않는다', () => {
    expect(isAdminLoginApprovalPendingResponse({ message: 'Account is inactive' }, 423)).toBe(
      false
    )
    expect(isAdminLoginApprovalPendingResponse(undefined, 423)).toBe(false)
  })

  it('423 + ACCOUNT_INACTIVE·LOGIN_DISABLED 는 승인 대기가 아니다', () => {
    expect(
      isAdminLoginApprovalPendingResponse(
        { error: { code: 'ACCOUNT_INACTIVE', message: '사용할 수 없는 계정입니다.' } },
        423
      )
    ).toBe(false)
    expect(
      isAdminLoginApprovalPendingResponse(
        { error: { code: 'LOGIN_DISABLED', message: '현재 로그인할 수 없는 계정입니다.' } },
        423
      )
    ).toBe(false)
  })

  it('does not match unrelated login failures', () => {
    expect(
      isAdminLoginApprovalPendingResponse({ error: { code: 'INVALID_CREDENTIALS' } }, 401)
    ).toBe(false)
  })
})

describe('isAdminLoginApprovalPendingError', () => {
  it('타입 오류와 axios 423 ACCOUNT_PENDING_APPROVAL 을 승인 대기로 본다', () => {
    expect(isAdminLoginApprovalPendingError(new AdminLoginApprovalPendingError())).toBe(true)
    expect(
      isAdminLoginApprovalPendingError(
        createAxiosError(423, { error: { code: 'ACCOUNT_PENDING_APPROVAL', message: 'pending' } })
      )
    ).toBe(true)
  })

  it('axios 423 ACCOUNT_INACTIVE·code 없음은 승인 대기가 아니다', () => {
    expect(
      isAdminLoginApprovalPendingError(
        createAxiosError(423, { error: { code: 'ACCOUNT_INACTIVE', message: 'inactive' } })
      )
    ).toBe(false)
    expect(isAdminLoginApprovalPendingError(createAxiosError(423, {}))).toBe(false)
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
