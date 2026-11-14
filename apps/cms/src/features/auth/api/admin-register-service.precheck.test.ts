import { beforeEach, describe, expect, it, vi } from 'vitest'

const post = vi.hoisted(() => vi.fn())
const remoteEnabled = vi.hoisted(() => ({ value: true }))

vi.mock('@/shared/api', () => ({ axiosClient: { post } }))
vi.mock('@/features/auth/api/admin-register-remote-capabilities', () => ({
  isAdminRegisterRemoteEnabled: () => remoteEnabled.value,
}))

import { precheckAdminSignupIdentity } from './admin-register-service'

const BODY = { identityVerificationSessionId: 7, profileToken: 'profile-token' }

function apiError(status: number, code: string) {
  return { response: { status, data: { success: false, error: { code, message: '서버 기본 문구' } } } }
}

describe('precheckAdminSignupIdentity — POST /api/admin/auth/signup/identity-precheck (BE R2)', () => {
  beforeEach(() => {
    post.mockReset()
    remoteEnabled.value = true
  })

  it('alreadyRegistered=false면 가입 절차를 계속한다', async () => {
    post.mockResolvedValueOnce({ data: { alreadyRegistered: false, registeredByAdmin: false, maskedEmail: null } })
    await expect(precheckAdminSignupIdentity(BODY)).resolves.toEqual({ kind: 'continue' })
    expect(post).toHaveBeenCalledWith(
      '/api/admin/auth/signup/identity-precheck',
      BODY,
      expect.objectContaining({ skipAuth: true, skipGlobalErrorAlert: true })
    )
  })

  it('관리자 등록 계정이면 「관리자 등록 회원 안내」', async () => {
    post.mockResolvedValueOnce({
      data: { alreadyRegistered: true, registeredByAdmin: true, maskedEmail: 'ki***@jakorea.org' },
    })
    await expect(precheckAdminSignupIdentity(BODY)).resolves.toEqual({
      kind: 'registered_by_admin',
      maskedEmail: 'ki***@jakorea.org',
    })
  })

  it('직접 가입 계정이면 「가입한 이메일 안내」', async () => {
    post.mockResolvedValueOnce({
      data: { alreadyRegistered: true, registeredByAdmin: false, maskedEmail: 'ki***@jakorea.org' },
    })
    await expect(precheckAdminSignupIdentity(BODY)).resolves.toEqual({
      kind: 'already_registered',
      maskedEmail: 'ki***@jakorea.org',
    })
  })

  it('400 IDENTITY_VERIFICATION_REQUIRED · 401은 본인인증부터 다시', async () => {
    post.mockRejectedValueOnce(apiError(400, 'IDENTITY_VERIFICATION_REQUIRED'))
    await expect(precheckAdminSignupIdentity(BODY)).resolves.toEqual({ kind: 'reverify' })
    post.mockRejectedValueOnce(apiError(401, 'UNAUTHORIZED'))
    await expect(precheckAdminSignupIdentity(BODY)).resolves.toEqual({ kind: 'reverify' })
  })

  it('429 등 그 밖의 오류는 호출부 공통 오류 처리로 던진다', async () => {
    const error = apiError(429, 'RATE_LIMITED')
    post.mockRejectedValueOnce(error)
    await expect(precheckAdminSignupIdentity(BODY)).rejects.toBe(error)
  })

  it('원격 API를 쓰지 않으면 호출하지 않고 계속한다', async () => {
    remoteEnabled.value = false
    await expect(precheckAdminSignupIdentity(BODY)).resolves.toEqual({ kind: 'continue' })
    expect(post).not.toHaveBeenCalled()
  })
})
