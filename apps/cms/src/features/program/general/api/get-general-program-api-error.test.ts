import { describe, expect, it } from 'vitest'
import {
  getGeneralProgramApiErrorMessage,
  getParticipationConsentRequiredMessage,
  getProgramFormBindingErrorMessage,
} from './get-general-program-api-error'

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

  it('수정 가능 기간 409 코드를 서로 다른 안내로 구분한다', () => {
    const errorFor = (code: string) => ({
      response: {
        status: 409,
        data: {
          success: false,
          error: { code, message: 'raw' },
        },
      },
    })
    expect(
      getGeneralProgramApiErrorMessage(
        errorFor('PROGRAM_COMMON_INFO_EDIT_PERIOD_ENDED'),
        'fallback'
      )
    ).toContain('공통 정보')
    expect(
      getGeneralProgramApiErrorMessage(errorFor('PROGRAM_PARTICIPANT_TYPE_IMMUTABLE'), 'fallback')
    ).toContain('참여자 유형')
    expect(
      getGeneralProgramApiErrorMessage(
        {
          response: {
            status: 409,
            data: {
              success: false,
              error: {
                code: 'PROGRAM_INSTRUCTOR_RECRUITMENT_EDIT_PERIOD_ENDED',
                message: '프로그램 운영이 시작된 이후에는 모집 정보를 수정할 수 없습니다.',
              },
            },
          },
        },
        'fallback'
      )
    ).toBe('프로그램 운영이 시작된 이후에는 모집 정보를 수정할 수 없습니다.')
    expect(
      getGeneralProgramApiErrorMessage(
        {
          response: {
            status: 409,
            data: {
              success: false,
              error: {
                code: 'PROGRAM_INSTRUCTOR_RECRUITMENT_EDIT_PERIOD_ENDED',
                message: '모집 시작 이후에는 신청 양식을 수정할 수 없습니다.',
              },
            },
          },
        },
        'fallback'
      )
    ).toBe('모집 시작 이후에는 신청 양식을 수정할 수 없습니다.')
  })

  it('참여 강사 등록·강등·포기 코드를 FE 메시지로 매핑한다', () => {
    const errorFor = (code: string) => ({
      response: {
        status: 409,
        data: {
          success: false,
          error: { code },
        },
      },
    })
    expect(
      getGeneralProgramApiErrorMessage(errorFor('PROGRAM_PARTICIPANT_ALREADY_EXISTS'), 'fallback')
    ).toBe('이미 이 프로그램에 참여 중입니다.')
    expect(
      getGeneralProgramApiErrorMessage(
        errorFor('INSTRUCTOR_REPRESENTATIVE_NOT_CURRENT'),
        'fallback'
      )
    ).toBe('현재 대표 강사가 아니면 일반 강사로 변경할 수 없습니다.')
    expect(
      getGeneralProgramApiErrorMessage(
        errorFor('PROGRAM_PARTICIPANT_GIVE_UP_BEFORE_FIRST_ACTIVITY'),
        'fallback'
      )
    ).toBe('첫 교육이 시작되기 전에는 활동 포기할 수 없습니다.')
    expect(
      getGeneralProgramApiErrorMessage(errorFor('FORM_RESPONSE_ALREADY_SUBMITTED'), 'fallback')
    ).toBe('이미 제출된 응답입니다. 수정은 응답 수정으로 해 주세요.')
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

describe('getProgramFormBindingErrorMessage', () => {
  const slotConflictError = {
    response: {
      status: 409,
      data: {
        success: false,
        message: '같은 프로그램 양식 슬롯에 이미 활성 양식이 연결되어 있습니다.',
        error: {
          code: 'PROGRAM_FORM_BINDING_ACTIVE_SLOT_CONFLICT',
          field: 'formBindings',
        },
      },
    },
  }

  it('SURVEY+SCHEDULE 슬롯 충돌은 동일 templateVersion 재등록 안내로 매핑한다', () => {
    expect(
      getProgramFormBindingErrorMessage(slotConflictError, 'fallback', {
        formType: 'SURVEY',
        targetScope: 'SCHEDULE',
      })
    ).toContain('동일한 설문 양식 버전')
  })

  it('LECTURE_EVALUATION+PROGRAM 슬롯 충돌은 프로그램 공통 강의평가 중복 안내', () => {
    expect(
      getProgramFormBindingErrorMessage(slotConflictError, 'fallback', {
        formType: 'LECTURE_EVALUATION',
        targetScope: 'PROGRAM',
      })
    ).toContain('이 프로그램에 등록된 강의평가가 이미 있습니다')
  })

  it('TRAINED_TEACHER_SATISFACTION_TEACHER_ONLY는 서버 메시지를 쓴다', () => {
    expect(
      getProgramFormBindingErrorMessage(
        {
          response: {
            status: 400,
            data: {
              success: false,
              error: {
                code: 'TRAINED_TEACHER_SATISFACTION_TEACHER_ONLY',
                message: '교육받은 교사 프로그램의 만족도조사는 교사만 대상으로 할 수 있습니다.',
                field: 'targetRole',
              },
            },
          },
        },
        'fallback',
        { formType: 'SATISFACTION' }
      )
    ).toBe('교육받은 교사 프로그램의 만족도조사는 교사만 대상으로 할 수 있습니다.')
  })

  it('만족도 등 다른 formType 슬롯 충돌은 기본 슬롯 안내를 쓴다', () => {
    expect(
      getProgramFormBindingErrorMessage(slotConflictError, 'fallback', {
        formType: 'SATISFACTION',
        targetScope: 'PROGRAM',
      })
    ).toBe('같은 프로그램 양식 슬롯에 이미 활성 양식이 연결되어 있습니다.')
  })
})

describe('getGeneralProgramApiErrorMessage program schedule codes', () => {
  it('maps slot key mismatch to user message', () => {
    expect(
      getGeneralProgramApiErrorMessage(
        {
          response: {
            data: {
              error: { code: 'PROGRAM_EDUCATION_SLOT_KEY_MISMATCH' },
            },
          },
        },
        'fallback'
      )
    ).toContain('educationSlotKey')
  })

  it('maps PROGRAM_SCHEDULE_NOT_ACTIVE', () => {
    expect(
      getGeneralProgramApiErrorMessage(
        { response: { data: { error: { code: 'PROGRAM_SCHEDULE_NOT_ACTIVE' } } } },
        'fallback'
      )
    ).toContain('비활성')
  })

  it('maps PROGRAM_SCHEDULE_NOT_EDUCATION_SLOT', () => {
    expect(
      getGeneralProgramApiErrorMessage(
        { response: { data: { error: { code: 'PROGRAM_SCHEDULE_NOT_EDUCATION_SLOT' } } } },
        'fallback'
      )
    ).toContain('EDUCATION')
  })
})

describe('getProgramFormBindingErrorMessage PROGRAM_SCHEDULE_NOT_EDUCATION_SLOT', () => {
  const error = {
    response: { data: { error: { code: 'PROGRAM_SCHEDULE_NOT_EDUCATION_SLOT' } } },
  }

  it('uses planned-slot copy for survey registration', () => {
    expect(
      getProgramFormBindingErrorMessage(error, 'fallback', {
        formType: 'SURVEY',
        targetScope: 'SCHEDULE',
      })
    ).toBe('교육 진행 예정일만 설문 대상으로 지정할 수 있습니다.')
  })

  it('keeps assignment copy outside survey registration', () => {
    expect(getProgramFormBindingErrorMessage(error, 'fallback')).toContain('EDUCATION')
    expect(
      getProgramFormBindingErrorMessage(error, 'fallback', {
        formType: 'LECTURE_EVALUATION',
        targetScope: 'SCHEDULE',
      })
    ).toContain('EDUCATION')
  })
})

describe('getParticipationConsentRequiredMessage', () => {
  const consentMessage =
    '강사 활동에 필요한 동의가 부족합니다: 성범죄 경력조회 동의(동의 기록 없음), 교육진행자 서약(만료됨). 해당 동의를 다시 받은 뒤 처리해 주세요.'

  it('동의 부족 409는 서버 문구(부족한 동의·사유)를 그대로 쓴다', () => {
    const error = {
      response: {
        status: 409,
        data: {
          success: false,
          data: null,
          message: consentMessage,
          error: {
            code: 'INSTRUCTOR_PARTICIPATION_CONSENT_REQUIRED',
            message: consentMessage,
            field: 'consentType',
            details: {
              missingConsentTypes: 'CRIMINAL_HISTORY_CHECK_CONSENT,FACILITATOR_PLEDGE',
              CRIMINAL_HISTORY_CHECK_CONSENT: 'MISSING',
              FACILITATOR_PLEDGE: 'EXPIRED',
            },
          },
        },
      },
    }
    expect(getParticipationConsentRequiredMessage(error)).toBe(consentMessage)
  })

  it('동의 코드가 아니면 undefined', () => {
    const error = {
      response: { status: 409, data: { error: { code: 'CONFLICT', message: 'x' } } },
    }
    expect(getParticipationConsentRequiredMessage(error)).toBeUndefined()
  })
})
