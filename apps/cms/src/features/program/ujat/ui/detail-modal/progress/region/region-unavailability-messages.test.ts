import { describe, expect, it } from 'vitest'
import { resolveRegionUnavailabilityErrorMessage } from './region-unavailability-messages'

function apiError(status: number, code: string) {
  return {
    response: {
      status,
      data: { error: { code, message: 'server-message-must-not-drive-branch' } },
    },
  }
}

describe('resolveRegionUnavailabilityErrorMessage', () => {
  it('error.code 5종은 HTTP 상태와 무관하게 고정 문구로 매핑한다', () => {
    expect(
      resolveRegionUnavailabilityErrorMessage(
        apiError(400, 'UJAT_REPLACEMENT_PARTICIPANT_REQUIRED'),
        'fallback'
      )
    ).toBe('배정된 교육이 있는 날짜에는 대체 봉사자를 선택해 주세요.')
    expect(
      resolveRegionUnavailabilityErrorMessage(
        apiError(400, 'UJAT_REPLACEMENT_PARTICIPANT_NOT_ALLOWED'),
        'fallback'
      )
    ).toBe(
      '선택한 교육일에는 배정이 없어 대체가 필요 없습니다. 대체 봉사자 선택을 해제한 뒤 다시 시도해 주세요.'
    )
    expect(
      resolveRegionUnavailabilityErrorMessage(
        apiError(400, 'UJAT_REPLACEMENT_PARTICIPANT_SAME_AS_SOURCE'),
        'fallback'
      )
    ).toBe('대체 봉사자는 참여 불가로 지정한 봉사자와 같을 수 없습니다.')
    expect(
      resolveRegionUnavailabilityErrorMessage(
        apiError(409, 'UJAT_REPLACEMENT_ALREADY_ASSIGNED_SAME_DAY'),
        'fallback'
      )
    ).toBe('선택한 대체 봉사자는 해당 교육일에 이미 다른 학급에 배정되어 있습니다.')
    expect(
      resolveRegionUnavailabilityErrorMessage(
        apiError(409, 'UJAT_REPLACEMENT_UNAVAILABLE_SAME_DAY'),
        'fallback'
      )
    ).toBe('선택한 대체 봉사자는 해당 교육일에 활동 불가로 등록되어 있습니다.')
  })
})
