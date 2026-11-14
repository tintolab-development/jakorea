import { beforeEach, describe, expect, it, vi } from 'vitest'

const post = vi.hoisted(() => vi.fn())

vi.mock('@/shared/api', () => ({ axiosClient: { post } }))
vi.mock('@/shared/config/real-api-modules', () => ({ isRealApiModuleEnabled: () => true }))

import { changePasswordAfterReset, verifyPasswordResetEligibility } from './find-password-service'

function apiError(status: number, code: string, field?: string) {
  return {
    isAxiosError: true,
    response: {
      status,
      data: { success: false, error: { code, message: `${code} 서버 문구`, field } },
    },
  }
}

const CONFIRM_INPUT = {
  email: 'admin@jakorea.org',
  identityVerificationSessionId: 1,
  profileToken: 'profile-token',
  newPassword: 'Abcdefgh123!',
  newPasswordConfirm: 'Abcdefgh123!',
}

const ELIGIBILITY_INPUT = {
  email: 'admin@jakorea.org',
  identityVerificationSessionId: 1,
  profileToken: 'profile-token',
}

describe('관리자 비밀번호 재설정 오류 코드 — confirm', () => {
  beforeEach(() => post.mockReset())

  it('401 PASSWORD_RESET_ACCOUNT_MISMATCH는 이메일 칸 안내용 서버 message를 넘긴다', async () => {
    post.mockRejectedValueOnce(apiError(401, 'PASSWORD_RESET_ACCOUNT_MISMATCH', 'email'))
    await expect(changePasswordAfterReset(CONFIRM_INPUT)).resolves.toEqual({
      kind: 'account_mismatch',
      message: 'PASSWORD_RESET_ACCOUNT_MISMATCH 서버 문구',
    })
  })

  it('401 PASSWORD_RESET_CONFIRM_MISMATCH는 확인값 칸 오류', async () => {
    post.mockRejectedValueOnce(apiError(401, 'PASSWORD_RESET_CONFIRM_MISMATCH', 'newPasswordConfirm'))
    await expect(changePasswordAfterReset(CONFIRM_INPUT)).resolves.toEqual({ kind: 'confirm_mismatch' })
  })

  it('401 IDENTITY_VERIFICATION_SESSION_REQUIRED는 본인인증부터 다시', async () => {
    post.mockRejectedValueOnce(apiError(401, 'IDENTITY_VERIFICATION_SESSION_REQUIRED'))
    await expect(changePasswordAfterReset(CONFIRM_INPUT)).resolves.toEqual({ kind: 'identity_required' })
  })

  it('그 밖의 오류는 기존처럼 api_error', async () => {
    post.mockRejectedValueOnce(apiError(400, 'VALIDATION_FAILED'))
    await expect(changePasswordAfterReset(CONFIRM_INPUT)).resolves.toEqual({
      kind: 'api_error',
      message: 'VALIDATION_FAILED 서버 문구',
    })
  })
})

describe('관리자 비밀번호 재설정 오류 코드 — eligibility', () => {
  beforeEach(() => post.mockReset())

  it('401 PASSWORD_RESET_ACCOUNT_MISMATCH·IDENTITY_VERIFICATION_SESSION_REQUIRED를 화면 처리로 넘긴다', async () => {
    post.mockRejectedValueOnce(apiError(401, 'PASSWORD_RESET_ACCOUNT_MISMATCH', 'email'))
    await expect(verifyPasswordResetEligibility(ELIGIBILITY_INPUT)).resolves.toEqual({
      kind: 'account_mismatch',
      message: 'PASSWORD_RESET_ACCOUNT_MISMATCH 서버 문구',
    })
    post.mockRejectedValueOnce(apiError(401, 'IDENTITY_VERIFICATION_SESSION_REQUIRED'))
    await expect(verifyPasswordResetEligibility(ELIGIBILITY_INPUT)).resolves.toEqual({
      kind: 'identity_required',
    })
  })

  it('eligible=false(200)는 기존처럼 가입 정보 없음', async () => {
    post.mockResolvedValueOnce({ data: { eligible: false, nextAction: 'REENTER_EMAIL' } })
    await expect(verifyPasswordResetEligibility(ELIGIBILITY_INPUT)).resolves.toEqual({
      kind: 'not_eligible',
    })
  })

  it('그 밖의 오류는 호출부 공통 처리로 던진다', async () => {
    const error = apiError(429, 'RATE_LIMITED')
    post.mockRejectedValueOnce(error)
    await expect(verifyPasswordResetEligibility(ELIGIBILITY_INPUT)).rejects.toBe(error)
  })
})
