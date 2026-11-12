import { describe, expect, it } from 'vitest'
import { AdminMfaApiError } from '@/features/auth/api/admin-auth-fetcher'
import { REGISTER_PASSWORD_CONDITION_MESSAGE } from '@/features/auth/lib/validate-register-password'
import { resolvePasswordChangeFailureAlert } from './profile-password-change-modal'

describe('resolvePasswordChangeFailureAlert', () => {
  it('VALIDATION_FAILED는 서버 message를 그대로 보여 준다 (QA-0478)', () => {
    const alert = resolvePasswordChangeFailureAlert(
      new AdminMfaApiError('VALIDATION_FAILED', '필수 입력값이 누락되었습니다.')
    )
    expect(alert.title).toBe('비밀번호 조건 안내')
    expect(alert.content.split('\n')[0]).toBe('필수 입력값이 누락되었습니다.')
  })

  it('VALIDATION_FAILED 서버 message가 비면 기존 조건 문구를 쓴다', () => {
    const alert = resolvePasswordChangeFailureAlert(new AdminMfaApiError('VALIDATION_FAILED', ' '))
    expect(alert.content.split('\n')[0]).toBe(REGISTER_PASSWORD_CONDITION_MESSAGE)
  })

  it('현재 비밀번호 불일치 코드는 기존 불일치 안내를 유지한다', () => {
    const alert = resolvePasswordChangeFailureAlert(
      new AdminMfaApiError('INVALID_CURRENT_PASSWORD', '현재 비밀번호를 확인해 주세요.')
    )
    expect(alert.title).toBe('비밀번호 불일치 안내')
  })

  it('그 외 코드는 서버 message를 그대로 보여 준다', () => {
    const alert = resolvePasswordChangeFailureAlert(
      new AdminMfaApiError(
        'PASSWORD_RECENTLY_USED',
        '최근에 사용한 비밀번호는 다시 사용할 수 없습니다. 다른 비밀번호를 입력해 주세요.'
      )
    )
    expect(alert.content).toBe(
      '최근에 사용한 비밀번호는 다시 사용할 수 없습니다. 다른 비밀번호를 입력해 주세요.'
    )
  })
})
