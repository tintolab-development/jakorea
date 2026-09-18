import { describe, expect, it } from 'vitest'
import { getGeneralProgramApiErrorMessage } from './get-general-program-api-error'

describe('getGeneralProgramApiErrorMessage', () => {
  it('business_start_date CONFLICT를 한글 안내로 변환한다', () => {
    const error = {
      response: {
        status: 409,
        data: {
          success: false,
          message:
            'CONFLICT: Program can only be modified before business_start_date when no earlier schedule lock is available.',
          error: {
            code: 'CONFLICT',
            message:
              'Program can only be modified before business_start_date when no earlier schedule lock is available.',
          },
        },
      },
    }
    expect(getGeneralProgramApiErrorMessage(error, 'fallback')).toContain('사업 시작일')
  })

  it('일반 message를 그대로 노출한다', () => {
    const error = {
      response: {
        status: 400,
        data: { message: 'Invalid field' },
      },
    }
    expect(getGeneralProgramApiErrorMessage(error, 'fallback')).toBe('Invalid field')
  })

  it('sponsor 관련 400을 한글 안내로 변환한다', () => {
    const error = {
      response: {
        status: 400,
        data: { message: 'sponsorId does not exist' },
      },
    }
    expect(getGeneralProgramApiErrorMessage(error, 'fallback')).toContain('후원사')
  })

  it('INVALID_PROGRAM_ASSIGNMENT_ROLE을 조회 전용 관리자 안내로 변환한다', () => {
    const error = {
      response: {
        status: 400,
        data: {
          success: false,
          message: '프로그램 담당 역할을 확인해 주세요.',
          error: {
            code: 'INVALID_PROGRAM_ASSIGNMENT_ROLE',
            message: '프로그램 담당 역할을 확인해 주세요.',
            field: 'role',
          },
        },
      },
    }
    expect(getGeneralProgramApiErrorMessage(error, 'fallback')).toBe(
      '조회 전용 관리자에게는 프로그램 뷰어 권한만 지정할 수 있습니다.'
    )
  })

  it('PREFERRED_SCHEDULE_* code를 FE 메시지로 매핑한다', () => {
    const error = {
      response: {
        status: 400,
        data: {
          success: false,
          error: {
            code: 'PREFERRED_SCHEDULE_OUTSIDE_EDUCATION_RANGE',
          },
        },
      },
    }
    expect(getGeneralProgramApiErrorMessage(error, 'fallback')).toBe(
      '희망 교육 일정이 프로그램 교육 가능 기간을 벗어났습니다.'
    )
  })

  it('PREFERRED_SCHEDULE_* 서버 메시지가 있으면 그대로 쓴다', () => {
    const error = {
      response: {
        status: 400,
        data: {
          success: false,
          message: '희망 교육 일정이 프로그램 교육 가능 기간을 벗어났습니다.',
          error: {
            code: 'PREFERRED_SCHEDULE_OUTSIDE_EDUCATION_RANGE',
            message: '희망 교육 일정이 프로그램 교육 가능 기간을 벗어났습니다.',
          },
        },
      },
    }
    expect(getGeneralProgramApiErrorMessage(error, 'fallback')).toBe(
      '희망 교육 일정이 프로그램 교육 가능 기간을 벗어났습니다.'
    )
  })
})
