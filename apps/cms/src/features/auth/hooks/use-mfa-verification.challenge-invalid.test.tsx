/** @vitest-environment jsdom */
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const post = vi.hoisted(() => vi.fn())

vi.mock('@/shared/api', () => ({ axiosClient: { post } }))

import { useAuthStore } from '@/features/auth/model/auth-store'
import { MFA_CHALLENGE_INVALID_MESSAGE } from '@/features/auth/lib/admin-mfa-contract'
import { useMfaVerification } from './use-mfa-verification'

/** 다른 탭·기기에서 다시 로그인해 이전 인증 요청이 무효가 된 경우의 서버 응답 */
function challengeInvalidError() {
  return {
    isAxiosError: true,
    message: 'Request failed with status code 401',
    response: {
      status: 401,
      data: {
        success: false,
        error: { code: 'MFA_CHALLENGE_INVALID', message: '서버 기본 문구' },
      },
    },
  }
}

describe('useMfaVerification — 401 MFA_CHALLENGE_INVALID', () => {
  const initialState = useAuthStore.getState()

  beforeEach(() => {
    post.mockReset()
    useAuthStore.setState({
      user: { email: 'admin@jakorea.org' } as ReturnType<typeof useAuthStore.getState>['user'],
      mfaState: {
        method: 'totp',
        isRequired: true,
        isVerified: false,
        accountLabel: 'admin@jakorea.org',
        lastSentAt: null,
        failedAttempts: 0,
        isLocked: false,
        lockUntil: null,
        challengeUuid: 'challenge-before-relogin',
        mfaMethod: 'TOTP',
        mfaSetupRequired: false,
      },
    })
  })

  afterEach(() => {
    useAuthStore.setState(initialState, true)
  })

  it('「만료」 없는 새 안내를 입력칸 위에 보여 주고 입력칸을 비운다(팝업 유지)', async () => {
    post.mockRejectedValueOnce(challengeInvalidError())
    const { result } = renderHook(() => useMfaVerification({ open: true }))
    const resetTokenBefore = result.current.otpResetToken

    await act(async () => {
      result.current.onOtpCodeChange('123456')
    })

    expect(result.current.verifyNotice).toBe(MFA_CHALLENGE_INVALID_MESSAGE)
    expect(result.current.verifyNotice).not.toContain('만료')
    expect(result.current.otpCode).toBe('')
    expect(result.current.otpResetToken).toBe(resetTokenBefore + 1)
    // 잘못된 코드가 아니므로 실패 횟수는 그대로
    expect(result.current.failedAttempts).toBe(0)
  })
})
