import { describe, expect, it } from 'vitest'
import { getMemberApiErrorMessage } from './get-member-api-error'

describe('getMemberApiErrorMessage', () => {
  it('maps PORTRAIT_CONSENT_CONTENT_UNAVAILABLE from a 410 response', () => {
    const message = getMemberApiErrorMessage(
      {
        response: {
          status: 410,
          data: { success: false, error: { code: 'PORTRAIT_CONSENT_CONTENT_UNAVAILABLE' } },
        },
      },
      'fallback'
    )

    expect(message).not.toBe('fallback')
    expect(message).toContain('초상권')
  })

  it('maps CMS_INDIVIDUAL_GRADE_REQUIRED_WHEN_ENROLLED when server message is empty', () => {
    const error = {
      response: {
        status: 400,
        data: {
          success: false,
          error: { code: 'CMS_INDIVIDUAL_GRADE_REQUIRED_WHEN_ENROLLED' },
        },
      },
    }
    expect(getMemberApiErrorMessage(error, 'fallback')).toContain('학년')
  })

  it('maps CMS_INDIVIDUAL_SCHOOL_NOT_ALLOWED_WHEN_NOT_ENROLLED', () => {
    const error = {
      response: {
        status: 400,
        data: {
          success: false,
          error: { code: 'CMS_INDIVIDUAL_SCHOOL_NOT_ALLOWED_WHEN_NOT_ENROLLED' },
        },
      },
    }
    expect(getMemberApiErrorMessage(error, 'fallback')).toContain('미재학')
  })

  it('maps INSTRUCTOR_JA_GRADE_POLICY_NOT_INITIALIZED', () => {
    const error = {
      response: {
        status: 409,
        data: {
          success: false,
          error: { code: 'INSTRUCTOR_JA_GRADE_POLICY_NOT_INITIALIZED' },
        },
      },
    }
    expect(getMemberApiErrorMessage(error, 'fallback')).toContain('JA 강사 등급 정책')
  })

  it('maps INSTRUCTOR_REVOKE_BLOCKED_BY_ACTIVE_PROGRAM over generic 409 message', () => {
    const error = {
      response: {
        status: 409,
        data: {
          success: false,
          message: '현재 데이터 또는 처리 상태와 충돌하여 요청을 완료할 수 없습니다.',
          error: {
            code: 'INSTRUCTOR_REVOKE_BLOCKED_BY_ACTIVE_PROGRAM',
            message: '현재 데이터 또는 처리 상태와 충돌하여 요청을 완료할 수 없습니다.',
          },
        },
      },
    }
    expect(getMemberApiErrorMessage(error, 'fallback')).toContain('참여 중인 프로그램')
  })

  it('maps ADMIN_APPROVAL_CANCEL_HAS_PROGRAM_ASSIGNMENT_HISTORY over generic 409 message', () => {
    const error = {
      response: {
        status: 409,
        data: {
          success: false,
          message: '현재 데이터 또는 처리 상태와 충돌하여 요청을 완료할 수 없습니다.',
          error: {
            code: 'ADMIN_APPROVAL_CANCEL_HAS_PROGRAM_ASSIGNMENT_HISTORY',
            message: '현재 데이터 또는 처리 상태와 충돌하여 요청을 완료할 수 없습니다.',
          },
        },
      },
    }

    expect(getMemberApiErrorMessage(error, 'fallback')).toContain('담당 이력')
  })

  it('maps CMS_MEMBER_DELETE_CURRENT_PASSWORD_INVALID', () => {
    const error = {
      response: {
        status: 400,
        data: {
          success: false,
          error: {
            code: 'CMS_MEMBER_DELETE_CURRENT_PASSWORD_INVALID',
            field: 'currentPassword',
            message: '현재 비밀번호를 확인해 주세요.',
          },
        },
      },
    }
    expect(getMemberApiErrorMessage(error, 'fallback')).toBe(
      '현재 비밀번호가 일치하지 않습니다.\n비밀번호를 확인 후 다시 시도해 주세요.'
    )
  })

  it('maps SETTLEMENT_ACCOUNT_UPDATE_VIA_CONSENT_ONLY', () => {
    const error = {
      response: {
        status: 409,
        data: {
          success: false,
          error: { code: 'SETTLEMENT_ACCOUNT_UPDATE_VIA_CONSENT_ONLY', field: 'settlement' },
        },
      },
    }
    expect(getMemberApiErrorMessage(error, 'fallback')).toBe(
      '정산 계좌는 지급조서 사전 동의서에서만 입력·수정할 수 있습니다.'
    )
  })

  describe('생년월일 범위·본인인증 회원 수정 (QA-0220)', () => {
    function apiError(status: number, code: string, message?: string) {
      return {
        response: {
          status,
          data: {
            success: false,
            ...(message ? { message } : {}),
            error: { code, field: 'birthDate', ...(message ? { message } : {}) },
          },
        },
      }
    }

    it('BIRTH_DATE_FUTURE_NOT_ALLOWED는 서버 문구를 그대로 보여 준다', () => {
      expect(
        getMemberApiErrorMessage(
          apiError(400, 'BIRTH_DATE_FUTURE_NOT_ALLOWED', '생년월일은 오늘 이후 날짜로 입력할 수 없습니다.'),
          'fallback'
        )
      ).toBe('생년월일은 오늘 이후 날짜로 입력할 수 없습니다.')
    })

    it('BIRTH_DATE_FUTURE_NOT_ALLOWED 서버 문구가 비면 같은 문구로 매핑한다', () => {
      expect(
        getMemberApiErrorMessage(apiError(400, 'BIRTH_DATE_FUTURE_NOT_ALLOWED'), 'fallback')
      ).toBe('생년월일은 오늘 이후 날짜로 입력할 수 없습니다.')
    })

    it('BIRTH_DATE_TOO_OLD는 FE 문구 없이 서버 원문을 쓴다 (기획 확인 대기)', () => {
      expect(
        getMemberApiErrorMessage(apiError(400, 'BIRTH_DATE_TOO_OLD', '입력값을 확인해 주세요.'), 'fallback')
      ).toBe('입력값을 확인해 주세요.')
    })

    it('BIRTH_DATE_TOO_OLD 서버 원문이 없으면 화면 공통 실패 문구를 쓴다', () => {
      expect(
        getMemberApiErrorMessage(apiError(400, 'BIRTH_DATE_TOO_OLD'), '회원 정보 저장에 실패했습니다.')
      ).toBe('회원 정보 저장에 실패했습니다.')
    })

    it('CMS_MEMBER_PROFILE_NOT_EDITABLE_AFTER_MEMBER_VERIFICATION은 공통 409 문구보다 매핑 문구를 쓴다', () => {
      expect(
        getMemberApiErrorMessage(
          apiError(
            409,
            'CMS_MEMBER_PROFILE_NOT_EDITABLE_AFTER_MEMBER_VERIFICATION',
            '현재 데이터 또는 처리 상태와 충돌하여 요청을 완료할 수 없습니다.'
          ),
          'fallback'
        )
      ).toBe('본인확인을 완료한 회원의 본인 소유 개인정보는 CMS에서 수정할 수 없습니다.')
    })
  })

  describe('학교 삭제 차단 (QA-0431)', () => {
    it.each([
      ['SCHOOL_HAS_ACTIVE_TEACHERS', '현재 소속 중인 교사가 있어 학교를 삭제할 수 없습니다.'],
      ['SCHOOL_HAS_ACTIVE_MEMBERS', '현재 데이터 또는 처리 상태와 충돌하여 요청을 완료할 수 없습니다.'],
      ['SCHOOL_HAS_BUSINESS_HISTORY', '프로그램·정산 등 업무 이력이 있어 학교를 삭제할 수 없습니다.'],
    ])('%s는 서버 원문을 그대로 보여 준다', (code, message) => {
      expect(
        getMemberApiErrorMessage(
          {
            response: {
              status: 409,
              data: { success: false, message, error: { code, message, field: 'organizationId' } },
            },
          },
          '회원 삭제에 실패했습니다.'
        )
      ).toBe(message)
    })

    it('SCHOOL_HAS_ACTIVE_MEMBERS 서버 원문이 없으면 공통 409 문구를 쓴다 (코드 노출 없음)', () => {
      const message = getMemberApiErrorMessage(
        {
          response: {
            status: 409,
            data: { success: false, error: { code: 'SCHOOL_HAS_ACTIVE_MEMBERS' } },
          },
        },
        '회원 삭제에 실패했습니다.'
      )
      expect(message).toBe('요청한 변경이 기존 데이터와 충돌합니다.')
      expect(message).not.toContain('SCHOOL_HAS_ACTIVE_MEMBERS')
    })
  })
})
