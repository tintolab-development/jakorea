import { describe, expect, it } from 'vitest'
import {
  INSTRUCTOR_FEE_POLICY_PAYMENT_CORRECTION_GUIDE,
  buildInstructorFeePolicySavedNotice,
  getInstructorFeePolicySaveErrorMessage,
} from './participating-instructor-fee-policy'

function apiError(code: string, message: string) {
  return { response: { status: 409, data: { error: { code, message } } } }
}

describe('getInstructorFeePolicySaveErrorMessage', () => {
  it('409 정산 있음은 서버 메시지 뒤에 지급 정정 안내를 붙인다', () => {
    const message = getInstructorFeePolicySaveErrorMessage(
      apiError('INSTRUCTOR_FEE_POLICY_SETTLEMENT_EXISTS', '정산이 있어 수정할 수 없습니다.'),
      'fallback'
    )
    expect(message).toContain('정산이 있어 수정할 수 없습니다.')
    expect(message).toContain(INSTRUCTOR_FEE_POLICY_PAYMENT_CORRECTION_GUIDE)
  })

  it('그 밖의 코드는 서버 메시지를 그대로 쓴다', () => {
    const message = getInstructorFeePolicySaveErrorMessage(
      apiError('PARTICIPANT_TYPE_UNSUPPORTED', '강사 참여자가 아닙니다.'),
      'fallback'
    )
    expect(message).not.toContain(INSTRUCTOR_FEE_POLICY_PAYMENT_CORRECTION_GUIDE)
  })
})

describe('buildInstructorFeePolicySavedNotice', () => {
  it('다시 반영된 정산 전 배정 수를 안내한다', () => {
    expect(buildInstructorFeePolicySavedNotice(2)).toContain('정산 전 배정 2건에 바로 반영')
  })

  it('반영 건수가 없으면 반영할 배정이 없다고 안내한다', () => {
    expect(buildInstructorFeePolicySavedNotice(0)).toContain('반영할 정산 전 배정이 없습니다')
    expect(buildInstructorFeePolicySavedNotice(undefined)).toContain(
      '이미 정산된 회차는 바뀌지 않습니다'
    )
  })
})
