import { AxiosError } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ADMIN_LOGIN_ACCOUNT_LOCKED_MESSAGE,
  AdminLoginAccountLockedError,
} from '@/features/auth/errors/admin-login-account-locked-error'
import {
  ADMIN_LOGIN_APPROVAL_PENDING_MESSAGE,
  AdminLoginApprovalPendingError,
} from '@/features/auth/errors/admin-login-approval-pending-error'
import {
  AdminLoginApiError,
  fetchAdminLogin,
  isAdminLoginAccountUnavailableError,
} from './admin-login-fetcher'

const { post } = vi.hoisted(() => ({ post: vi.fn() }))

vi.mock('@/shared/api', () => ({ axiosClient: { post } }))

function createAxiosError(status: number, data: unknown) {
  return new AxiosError('Request failed', undefined, undefined, undefined, {
    status,
    data,
    statusText: 'Error',
    headers: {},
    config: {} as never,
  })
}

async function loginFailure(status: number, data: unknown): Promise<unknown> {
  post.mockRejectedValueOnce(createAxiosError(status, data))
  return fetchAdminLogin({ email: 'admin@jakorea.org', password: 'pw' } as never).catch(
    (error: unknown) => error
  )
}

describe('fetchAdminLogin — 423 응답은 error.code 로 구분한다', () => {
  beforeEach(() => {
    post.mockReset()
  })

  it('423 + ACCOUNT_PENDING_APPROVAL → 승인 대기 안내', async () => {
    const error = await loginFailure(423, {
      error: { code: 'ACCOUNT_PENDING_APPROVAL', message: 'pending approval' },
    })
    expect(error).toBeInstanceOf(AdminLoginApprovalPendingError)
    expect((error as Error).message).toBe(ADMIN_LOGIN_APPROVAL_PENDING_MESSAGE)
  })

  it('423 + ACCOUNT_LOCKED → 잠금 안내 (승인 대기 아님)', async () => {
    const error = await loginFailure(423, {
      error: { code: 'ACCOUNT_LOCKED', message: 'Account locked' },
    })
    expect(error).toBeInstanceOf(AdminLoginAccountLockedError)
    expect(error).not.toBeInstanceOf(AdminLoginApprovalPendingError)
    expect((error as Error).message).toBe(ADMIN_LOGIN_ACCOUNT_LOCKED_MESSAGE)
  })

  it('423 + ACCOUNT_INACTIVE → 서버 message 그대로 (승인 대기 아님)', async () => {
    const error = await loginFailure(423, {
      error: { code: 'ACCOUNT_INACTIVE', message: '사용할 수 없는 계정입니다.' },
    })
    expect(error).toBeInstanceOf(AdminLoginApiError)
    expect(error).toMatchObject({ code: 'ACCOUNT_INACTIVE', message: '사용할 수 없는 계정입니다.' })
    expect(isAdminLoginAccountUnavailableError(error)).toBe(true)
  })

  it('423 + LOGIN_DISABLED → 서버 message 그대로 (승인 대기 아님)', async () => {
    const error = await loginFailure(423, {
      error: { code: 'LOGIN_DISABLED', message: '현재 로그인할 수 없는 계정입니다.' },
    })
    expect(error).toBeInstanceOf(AdminLoginApiError)
    expect(error).toMatchObject({
      code: 'LOGIN_DISABLED',
      message: '현재 로그인할 수 없는 계정입니다.',
    })
    expect(isAdminLoginAccountUnavailableError(error)).toBe(true)
  })

  it('423 + code 없음 → 승인 대기로 판단하지 않는다', async () => {
    const error = await loginFailure(423, { message: 'Locked' })
    expect(error).not.toBeInstanceOf(AdminLoginApprovalPendingError)
    expect(await loginFailure(423, {})).not.toBeInstanceOf(AdminLoginApprovalPendingError)
  })

  it('401 INVALID_CREDENTIALS 는 일반 로그인 실패다', async () => {
    const error = await loginFailure(401, {
      error: { code: 'INVALID_CREDENTIALS', message: '이메일 또는 비밀번호가 올바르지 않습니다.' },
    })
    expect(error).toBeInstanceOf(AdminLoginApiError)
    expect(error).toMatchObject({ code: 'INVALID_CREDENTIALS' })
    expect(isAdminLoginAccountUnavailableError(error)).toBe(false)
  })
})
