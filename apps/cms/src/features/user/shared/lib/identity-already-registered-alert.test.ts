import { describe, expect, it, vi } from 'vitest'
import { IdentityAlreadyRegisteredError } from '@/features/user/api/identity-already-registered-error'
import {
  IDENTITY_ALREADY_REGISTERED_ALERT,
  showIdentityAlreadyRegisteredAlertIfNeeded,
} from './identity-already-registered-alert'

describe('showIdentityAlreadyRegisteredAlertIfNeeded', () => {
  it('시안 문구(Figma 16909-166288)와 같다', () => {
    expect(IDENTITY_ALREADY_REGISTERED_ALERT).toEqual({
      title: '회원 정보 중복 안내',
      content:
        '동일한 회원 정보(이름, 생년월일, 휴대폰 번호)의 회원이 이미 등록되어 있습니다.\n회원 목록에서 기존 회원 정보를 확인해 주세요.',
    })
  })

  it.each(['admin', 'pre-register'] as const)('%s 중복이면 안내를 한 번 띄운다', scope => {
    const showAlert = vi.fn()
    expect(
      showIdentityAlreadyRegisteredAlertIfNeeded(
        new IdentityAlreadyRegisteredError(scope),
        showAlert
      )
    ).toBe(true)
    expect(showAlert).toHaveBeenCalledTimes(1)
    expect(showAlert).toHaveBeenCalledWith(IDENTITY_ALREADY_REGISTERED_ALERT)
  })

  it('다른 오류(이메일 중복 등)는 띄우지 않는다 — 전역 알럿이 서버 문구로 안내한다', () => {
    const showAlert = vi.fn()
    expect(
      showIdentityAlreadyRegisteredAlertIfNeeded(
        new Error('이미 사용 중인 이메일입니다.'),
        showAlert
      )
    ).toBe(false)
    expect(showAlert).not.toHaveBeenCalled()
  })
})
