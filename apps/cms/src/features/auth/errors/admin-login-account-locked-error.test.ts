import { AxiosError } from 'axios'
import { describe, expect, it } from 'vitest'
import {
  ADMIN_LOGIN_ACCOUNT_LOCKED_MESSAGE,
  AdminLoginAccountLockedError,
  isAdminLoginAccountLockedError,
  isAdminLoginAccountLockedResponse,
} from './admin-login-account-locked-error'

function createAxiosError(status: number, data: unknown) {
  return new AxiosError('Request failed', undefined, undefined, undefined, {
    status,
    data,
    statusText: 'Error',
    headers: {},
    config: {} as never,
  })
}

describe('isAdminLoginAccountLockedResponse', () => {
  it('detail 의 잠금 문구로 판정한다', () => {
    expect(
      isAdminLoginAccountLockedResponse({
        detail: '로그인에 여러 번 실패하여 계정이 30분간 잠겼습니다.',
      })
    ).toBe(true)
  })

  it('잠금 코드로 판정한다', () => {
    expect(isAdminLoginAccountLockedResponse({ error: { code: 'ACCOUNT_LOCKED' } })).toBe(true)
    expect(isAdminLoginAccountLockedResponse({ code: 'account_locked' })).toBe(true)
  })

  it('승인 대기·자격 증명 오류는 잠금이 아니다', () => {
    expect(isAdminLoginAccountLockedResponse({ error: { code: 'ACCOUNT_INACTIVE' } })).toBe(false)
    expect(
      isAdminLoginAccountLockedResponse({ error: { code: 'INVALID_CREDENTIALS', message: '비밀번호 불일치' } })
    ).toBe(false)
  })
})

describe('isAdminLoginAccountLockedError', () => {
  it('타입 오류와 axios 423 잠금 응답을 잠금으로 본다', () => {
    expect(isAdminLoginAccountLockedError(new AdminLoginAccountLockedError())).toBe(true)
    expect(
      isAdminLoginAccountLockedError(createAxiosError(423, { detail: '계정이 30분간 잠겼습니다.' }))
    ).toBe(true)
  })

  it('시안 문구를 쓴다', () => {
    expect(ADMIN_LOGIN_ACCOUNT_LOCKED_MESSAGE).toBe(
      '계정이 일시적으로 잠겼습니다. 비밀번호를 찾거나 30분 후 다시 시도해 주세요.'
    )
  })
})
