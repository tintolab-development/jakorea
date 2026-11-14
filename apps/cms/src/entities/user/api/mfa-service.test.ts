import { describe, expect, it, vi } from 'vitest'

const fetchAdminMfaVerify = vi.hoisted(() => vi.fn())

vi.mock('@/features/auth/api/admin-auth-fetcher', async importOriginal => {
  const actual = await importOriginal<typeof import('@/features/auth/api/admin-auth-fetcher')>()
  return { ...actual, fetchAdminMfaVerify }
})

import { AdminMfaApiError } from '@/features/auth/api/admin-auth-fetcher'
import { verifyTotp } from './mfa-service'

describe('verifyTotp — 401 MFA_VERIFICATION_FAILED', () => {
  it('error.details의 서버 누적 실패 횟수(문자열)를 숫자로 넘긴다', async () => {
    fetchAdminMfaVerify.mockRejectedValueOnce(
      new AdminMfaApiError('MFA_VERIFICATION_FAILED', '인증번호가 올바르지 않습니다.', 401, {
        failedAttemptCount: '2',
        maxFailedAttempts: '5',
      })
    )
    const result = await verifyTotp('admin@ja.org', '123456', { challengeUuid: 'challenge-1' })
    expect(result.errorCode).toBe('MFA_VERIFICATION_FAILED')
    expect(result.serverFailedAttemptCount).toBe(2)
    expect(result.serverMaxFailedAttempts).toBe(5)
  })

  it('details가 없으면 서버 값도 없음으로 둔다', async () => {
    fetchAdminMfaVerify.mockRejectedValueOnce(
      new AdminMfaApiError('MFA_VERIFICATION_FAILED', '인증번호가 올바르지 않습니다.', 401)
    )
    const result = await verifyTotp('admin@ja.org', '123456', { challengeUuid: 'challenge-1' })
    expect(result.serverFailedAttemptCount).toBeUndefined()
  })
})
