import { AxiosError } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminMfaApiError, fetchAdminMfaVerify } from './admin-auth-fetcher'

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

async function verifyFailure(status: number, data: unknown): Promise<AdminMfaApiError> {
  post.mockRejectedValueOnce(createAxiosError(status, data))
  const error = await fetchAdminMfaVerify({
    challengeUuid: 'challenge-1',
    verificationCode: '123456',
  }).catch((e: unknown) => e)
  expect(error).toBeInstanceOf(AdminMfaApiError)
  return error as AdminMfaApiError
}

describe('fetchAdminMfaVerify — 423 오류 코드 판정', () => {
  beforeEach(() => {
    post.mockReset()
  })

  it('본문 ACCOUNT_LOCKED 는 그대로 잠금 코드다', async () => {
    expect((await verifyFailure(423, { error: { code: 'ACCOUNT_LOCKED' } })).code).toBe(
      'ACCOUNT_LOCKED'
    )
  })

  it('본문 code 가 있으면 423 이어도 ACCOUNT_LOCKED 로 바꾸지 않는다', async () => {
    expect(
      (await verifyFailure(423, { error: { code: 'ACCOUNT_INACTIVE', message: '사용할 수 없는 계정입니다.' } }))
        .code
    ).toBe('ACCOUNT_INACTIVE')
    expect((await verifyFailure(423, { error: { code: 'MFA_FAILED' } })).code).toBe('MFA_FAILED')
  })

  it('본문 code 가 없을 때만 423 을 ACCOUNT_LOCKED 로 추정하고 잠금 문구를 쓴다', async () => {
    const error = await verifyFailure(423, { message: 'Locked' })
    expect(error.code).toBe('ACCOUNT_LOCKED')
    expect(error.message).toBe('인증 시도 횟수를 초과했습니다. 30분 후 다시 시도해주세요.')
  })

  it('423 ACCOUNT_INACTIVE·LOGIN_DISABLED 는 서버 message 를 그대로 쓴다', async () => {
    expect(
      (await verifyFailure(423, { error: { code: 'ACCOUNT_INACTIVE', message: '사용할 수 없는 계정입니다.' } }))
        .message
    ).toBe('사용할 수 없는 계정입니다.')
    expect(
      (await verifyFailure(423, { error: { code: 'LOGIN_DISABLED', message: '현재 로그인할 수 없는 계정입니다.' } }))
        .message
    ).toBe('현재 로그인할 수 없는 계정입니다.')
  })
})
