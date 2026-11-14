import { describe, expect, it, vi } from 'vitest'

const post = vi.hoisted(() => vi.fn())

vi.mock('@/shared/api', () => ({ axiosClient: { post } }))

import { classifyAdminIdentityConfirmError, confirmAdminIdentity } from './admin-identity-confirm'

function apiError(status: number, code: string) {
  return { response: { status, data: { success: false, error: { code, message: '서버 기본 문구' } } } }
}

describe('confirmAdminIdentity — POST /api/admin/auth/identity/confirm (BE R1)', () => {
  it('성공(200)이면 비밀번호 변경으로 진행한다', async () => {
    post.mockResolvedValueOnce({ data: { identityVerified: true, identityVerifiedAt: '2026-11-14T00:00:00Z' } })
    await expect(
      confirmAdminIdentity({ identityVerificationSessionId: 1, profileToken: 'token' })
    ).resolves.toEqual({ kind: 'confirmed' })
    expect(post).toHaveBeenCalledWith(
      '/api/admin/auth/identity/confirm',
      { identityVerificationSessionId: 1, profileToken: 'token' },
      expect.objectContaining({ skipGlobalErrorAlert: true })
    )
  })

  it('서버 거부는 error.code로만 분기한다', async () => {
    post.mockRejectedValueOnce(apiError(400, 'ADMIN_IDENTITY_MISMATCH'))
    await expect(
      confirmAdminIdentity({ identityVerificationSessionId: 1, profileToken: 'token' })
    ).resolves.toEqual({ kind: 'mismatch' })
  })

  it('분류되지 않은 오류는 호출부 공통 처리로 던진다', async () => {
    const error = apiError(500, 'INTERNAL_ERROR')
    post.mockRejectedValueOnce(error)
    await expect(
      confirmAdminIdentity({ identityVerificationSessionId: 1, profileToken: 'token' })
    ).rejects.toBe(error)
  })
})

describe('classifyAdminIdentityConfirmError', () => {
  it('코드별 처리', () => {
    expect(classifyAdminIdentityConfirmError(apiError(409, 'ADMIN_IDENTITY_ALREADY_VERIFIED'))).toEqual({
      kind: 'confirmed',
    })
    expect(
      classifyAdminIdentityConfirmError(apiError(409, 'ADMIN_IDENTITY_ALREADY_VERIFIED_BY_OTHER'))
    ).toEqual({ kind: 'verified_by_other' })
    expect(classifyAdminIdentityConfirmError(apiError(409, 'IDENTITY_VERIFICATION_ALREADY_USED'))).toEqual({
      kind: 'reverify',
    })
    expect(classifyAdminIdentityConfirmError(apiError(400, 'IDENTITY_VERIFICATION_REQUIRED'))).toEqual({
      kind: 'reverify',
    })
    expect(classifyAdminIdentityConfirmError(apiError(401, 'TOKEN_EXPIRED'))).toEqual({ kind: 'reverify' })
    expect(classifyAdminIdentityConfirmError(apiError(500, 'INTERNAL_ERROR'))).toBeNull()
  })
})
