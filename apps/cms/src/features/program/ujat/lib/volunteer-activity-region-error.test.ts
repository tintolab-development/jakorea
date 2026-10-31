import { describe, expect, it } from 'vitest'
import { getVolunteerActivityRegionErrorMessage } from './volunteer-activity-region-error'

function axiosError(code: string, message?: string, details?: Record<string, unknown>) {
  return {
    response: {
      status: code.startsWith('UJAT_VOLUNTEER_REGION') ? 409 : 400,
      data: {
        success: false,
        data: null,
        message: message ?? null,
        error: { code, details },
      },
    },
  }
}

describe('getVolunteerActivityRegionErrorMessage', () => {
  it('서버 message를 우선한다', () => {
    expect(
      getVolunteerActivityRegionErrorMessage(
        axiosError('UJAT_EDUCATION_REGION_NOT_FOUND', '등록되지 않은 교육 지역입니다.')
      )
    ).toBe('등록되지 않은 교육 지역입니다.')
  })

  it('409 배정 충돌은 건수를 안내한다', () => {
    expect(
      getVolunteerActivityRegionErrorMessage(
        axiosError('UJAT_VOLUNTEER_REGION_CHANGE_HAS_ACTIVE_ASSIGNMENTS', undefined, {
          upcomingAssignmentCount: 2,
        })
      )
    ).toContain('2건')
  })
})
