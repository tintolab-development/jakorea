import { describe, expect, it } from 'vitest'
import {
  formatInstructorOrganizationContextRequiredMessage,
  formatInstructorOrganizationScheduleScopeMessage,
  INSTRUCTOR_ORGANIZATION_CONTEXT_REQUIRED,
  INSTRUCTOR_ORGANIZATION_SCHEDULE_SCOPE_INVALID,
  ORGANIZATION_CONTEXT_GUIDE,
} from './instructor-organization-schedule-scope'

function scopeError(code = INSTRUCTOR_ORGANIZATION_SCHEDULE_SCOPE_INVALID) {
  return {
    response: {
      status: 409,
      data: {
        success: false,
        message: '선택한 기관의 승인된 희망 교육 일정과 일치하는지 확인해 주세요.',
        error: {
          code,
          message: '선택한 기관의 승인된 희망 교육 일정과 일치하는지 확인해 주세요.',
          field: 'organizationApplicationId',
        },
      },
    },
  }
}

describe('formatInstructorOrganizationScheduleScopeMessage', () => {
  it('스코프 409면 서버 message만 반환한다', () => {
    const message = formatInstructorOrganizationScheduleScopeMessage(scopeError())
    expect(message).toBe(
      '선택한 기관의 승인된 희망 교육 일정과 일치하는지 확인해 주세요.'
    )
    expect(message).not.toContain('먼저 배정')
  })

  it('다른 코드는 null', () => {
    expect(
      formatInstructorOrganizationScheduleScopeMessage(scopeError('INSTRUCTOR_ASSIGNMENT_CONFLICT'))
    ).toBeNull()
  })
})

describe('formatInstructorOrganizationContextRequiredMessage', () => {
  it('INSTRUCTOR_ORGANIZATION_CONTEXT_REQUIRED면 안내 문구를 반환한다', () => {
    const error = {
      response: {
        status: 409,
        data: {
          success: false,
          error: {
            code: INSTRUCTOR_ORGANIZATION_CONTEXT_REQUIRED,
            message: ORGANIZATION_CONTEXT_GUIDE,
          },
        },
      },
    }
    expect(formatInstructorOrganizationContextRequiredMessage(error)).toBe(
      ORGANIZATION_CONTEXT_GUIDE
    )
  })
})
