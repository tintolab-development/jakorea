import { describe, expect, it, vi } from 'vitest'
import type { IdentityChallengeCompleteResult } from '@jakorea/identity-verification'
import {
  completeAdminIdentityReverification,
  type CompleteAdminIdentityReverificationDeps,
  IDENTITY_REVERIFY_FAILURE_ALERT_TITLE,
  IDENTITY_REVERIFY_SUCCESS_ALERT,
} from './admin-identity-contact'

const result: IdentityChallengeCompleteResult = {
  sessionId: 321,
  profileToken: 'profile-token',
  verifiedPhone: '01099998888',
  verifiedAt: '2026-11-14T10:00:00',
}

function mismatchError(code: string, message: string) {
  return {
    response: {
      status: 400,
      data: { success: false, data: null, message, error: { code, message, field: null } },
    },
  }
}

function setup(updateContact: ReturnType<typeof vi.fn>) {
  const updateUser = vi.fn()
  const showAlert = vi.fn()
  const deps: CompleteAdminIdentityReverificationDeps = {
    updateUser,
    showAlert,
    updateContact:
      updateContact as unknown as CompleteAdminIdentityReverificationDeps['updateContact'],
    isRemoteEnabled: () => true,
  }
  return { updateUser, showAlert, deps }
}

describe('completeAdminIdentityReverification', () => {
  it('성공하면 세션 id·토큰으로 서버에 반영하고 응답 휴대폰 번호만 갱신한 뒤 인증 완료를 띄운다', async () => {
    const updateContact = vi.fn().mockResolvedValue({
      name: '홍관리',
      phone: '01011112222',
      maskedPhone: '010-****-2222',
      birthDate: '1990-01-01',
      gender: 'MALE',
      nextAction: 'IDENTITY_CONTACT_UPDATED',
    })
    const { updateUser, showAlert, deps } = setup(updateContact)

    await completeAdminIdentityReverification(result, deps)

    expect(updateContact).toHaveBeenCalledWith({
      identityVerificationSessionId: 321,
      profileToken: 'profile-token',
    })
    expect(updateUser).toHaveBeenCalledTimes(1)
    expect(updateUser).toHaveBeenCalledWith({ phone: '01011112222' })
    expect(showAlert).toHaveBeenCalledWith(IDENTITY_REVERIFY_SUCCESS_ALERT)
  })

  it.each([
    ['IDENTITY_VERIFICATION_NAME_MISMATCH', '본인인증 이름이 가입 정보와 일치하지 않습니다.'],
    [
      'IDENTITY_VERIFICATION_BIRTH_DATE_MISMATCH',
      '본인인증 생년월일이 가입 정보와 일치하지 않습니다.',
    ],
    ['IDENTITY_VERIFICATION_GENDER_MISMATCH', '본인인증 성별이 가입 정보와 일치하지 않습니다.'],
  ])(
    '%s이면 본인인증 실패 팝업(서버 문구)을 띄우고 휴대폰 번호를 바꾸지 않는다',
    async (code, message) => {
      const updateContact = vi.fn().mockRejectedValue(mismatchError(code, message))
      const { updateUser, showAlert, deps } = setup(updateContact)

      await completeAdminIdentityReverification(result, deps)

      expect(updateUser).not.toHaveBeenCalled()
      expect(showAlert).toHaveBeenCalledTimes(1)
      expect(showAlert).toHaveBeenCalledWith({
        title: IDENTITY_REVERIFY_FAILURE_ALERT_TITLE,
        content: message,
      })
    }
  )

  it('목업 모드에서는 서버를 부르지 않고 인증 결과 휴대폰 번호로 화면만 갱신한다', async () => {
    const updateContact = vi.fn()
    const { updateUser, showAlert, deps } = setup(updateContact)

    await completeAdminIdentityReverification(result, { ...deps, isRemoteEnabled: () => false })

    expect(updateContact).not.toHaveBeenCalled()
    expect(updateUser).toHaveBeenCalledWith({ phone: '01099998888' })
    expect(showAlert).toHaveBeenCalledWith(IDENTITY_REVERIFY_SUCCESS_ALERT)
  })
})
