import { describe, expect, it } from 'vitest'
import {
  buildDirectAssignSuccessMessage,
  resolveRegionAssignmentErrorMessage,
} from './region-assignment-messages'

function apiError(status: number, code: string, message: string) {
  return { response: { status, data: { success: false, error: { code, message } } } }
}

describe('resolveRegionAssignmentErrorMessage', () => {
  it('서버 응답이 있으면 error.code별 서버 한국어 message를 그대로 쓴다', () => {
    expect(
      resolveRegionAssignmentErrorMessage(
        apiError(409, 'UJAT_VOLUNTEER_ALREADY_ASSIGNED_SAME_DAY', '같은 날 이미 배정된 봉사자입니다.'),
        'fallback'
      )
    ).toBe('같은 날 이미 배정된 봉사자입니다.')
    expect(
      resolveRegionAssignmentErrorMessage(
        apiError(400, 'UJAT_ATTENDANCE_MANAGER_NOT_ASSIGNED', '해당 교육일에 배정된 봉사자만 지정할 수 있습니다.'),
        'fallback'
      )
    ).toBe('해당 교육일에 배정된 봉사자만 지정할 수 있습니다.')
  })

  it('클라이언트 내부 오류 코드는 노출하지 않고 fallback을 쓴다', () => {
    expect(resolveRegionAssignmentErrorMessage(new Error('NO_SCHEDULES_FOR_DATES'), '설정 실패')).toBe(
      '설정 실패'
    )
  })

  it('영어·코드 메시지는 한국어로 치환한다', () => {
    expect(
      resolveRegionAssignmentErrorMessage(
        apiError(409, 'UJAT_PARTNER_ASSIGNMENT_CONFLICT', 'UJAT_PARTNER_ASSIGNMENT_CONFLICT'),
        'fallback'
      )
    ).toBe('다른 관리자가 같은 학급을 배정했습니다. 배정표를 새로고침해 주세요.')
    expect(
      resolveRegionAssignmentErrorMessage(
        apiError(
          409,
          'UJAT_VOLUNTEER_ALREADY_ASSIGNED_SAME_DAY',
          'Volunteer is already assigned on the same education day.'
        ),
        'fallback'
      )
    ).toBe('같은 날 이미 다른 학급에 배정된 봉사자입니다.')
  })
})

describe('buildDirectAssignSuccessMessage', () => {
  it('1인 슬롯 보강·2인조 이동·일반 배정을 구분한다', () => {
    expect(buildDirectAssignSuccessMessage({ addedAsSecondary: true })).toContain('두 번째 봉사자')
    expect(buildDirectAssignSuccessMessage({ movedFromExistingPair: true })).toContain('2인조')
    expect(buildDirectAssignSuccessMessage({ addedAsSecondary: false })).toBe(
      '교육일이 직접 배정되었습니다.'
    )
  })
})
