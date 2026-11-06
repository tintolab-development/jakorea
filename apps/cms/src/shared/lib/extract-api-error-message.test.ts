import { describe, expect, it } from 'vitest'
import {
  extractApiErrorMessage,
  formatApiErrorAlertContent,
  getApiErrorCode,
  getApiErrorHttpStatus,
  isApiWorkflowConflictError,
} from './extract-api-error-message'

describe('extractApiErrorMessage', () => {
  it('매핑 없는 코드만 있으면 코드를 노출하지 않고 fallback을 쓴다', () => {
    expect(
      extractApiErrorMessage(
        { success: false, error: { code: 'UNKNOWN_SNAKE_CODE' } },
        { fallback: '요청 처리에 실패했습니다.' }
      )
    ).toBe('요청 처리에 실패했습니다.')
    expect(
      extractApiErrorMessage(
        { success: false, error: { code: 'UNKNOWN_SNAKE_CODE' } },
        { httpStatus: 409 }
      )
    ).toBe('요청한 변경이 기존 데이터와 충돌합니다.')
  })

  it('error.message를 top-level message보다 우선한다', () => {
    expect(
      extractApiErrorMessage({
        success: false,
        message: 'CONFLICT: ADMIN_EMAIL_ALREADY_EXISTS',
        error: { code: 'CONFLICT', message: 'ADMIN_EMAIL_ALREADY_EXISTS' },
      })
    ).toBe('ADMIN_EMAIL_ALREADY_EXISTS')
  })

  it('top-level message가 없으면 error.message를 그대로 반환한다', () => {
    expect(
      extractApiErrorMessage({
        error: { code: 'CONFLICT', message: 'ADMIN_EMAIL_ALREADY_EXISTS' },
      })
    ).toBe('ADMIN_EMAIL_ALREADY_EXISTS')
  })

  it('같은 모집 기간 코드는 서버 error.message를 구분해서 쓴다', () => {
    expect(
      extractApiErrorMessage({
        success: false,
        error: {
          code: 'PROGRAM_VOLUNTEER_RECRUITMENT_EDIT_PERIOD_ENDED',
          message: '프로그램 운영이 시작된 이후에는 모집 정보를 수정할 수 없습니다.',
        },
      })
    ).toBe('프로그램 운영이 시작된 이후에는 모집 정보를 수정할 수 없습니다.')
    expect(
      extractApiErrorMessage({
        success: false,
        error: {
          code: 'PROGRAM_VOLUNTEER_RECRUITMENT_EDIT_PERIOD_ENDED',
          message: '모집 시작 이후에는 신청 양식을 수정할 수 없습니다.',
        },
      })
    ).toBe('모집 시작 이후에는 신청 양식을 수정할 수 없습니다.')
  })

  it('모집 구조 코드만 오면 정책 문구를 쓴다', () => {
    expect(
      extractApiErrorMessage({
        success: false,
        error: { code: 'PROGRAM_STRUCTURE_EDIT_PERIOD_ENDED' },
      })
    ).toBe('최초 모집 시작일 이후에는 모집 단위(추가/삭제)를 변경할 수 없습니다.')
    expect(
      extractApiErrorMessage({
        success: false,
        error: {
          code: 'PROGRAM_STRUCTURE_EDIT_PERIOD_ENDED',
          message: '서버가 내려준 구조 잠금 문장',
        },
      })
    ).toBe('서버가 내려준 구조 잠금 문장')
  })

  it('Alert 본문에 traceId를 붙이지 않는다', () => {
    expect(
      formatApiErrorAlertContent({
        message: 'CONFLICT: ADMIN_EMAIL_ALREADY_EXISTS',
        error: {
          code: 'CONFLICT',
          message: 'ADMIN_EMAIL_ALREADY_EXISTS',
          traceId: '665a7c8aa9a34fd59bac13d8beb969af',
        },
      })
    ).toBe('ADMIN_EMAIL_ALREADY_EXISTS')
  })

  it('정산 계좌 가드 코드는 서버 메시지가 없으면 동의서 안내를 쓴다', () => {
    expect(
      extractApiErrorMessage({
        error: { code: 'SETTLEMENT_ACCOUNT_UPDATE_VIA_CONSENT_ONLY' },
      })
    ).toBe('정산 계좌는 지급조서 사전 동의서에서만 입력·수정할 수 있습니다.')
    expect(
      extractApiErrorMessage({
        error: { code: 'SETTLEMENT_BANK_ACCOUNT_REQUIRED' },
      })
    ).toBe(
      '지급조서 사전 동의서를 작성·완료하세요. 등록된 정산 계좌가 없어 계좌이체를 생성할 수 없습니다.'
    )
  })

  it('UJAT P0 코드는 서버 메시지가 코드일 때 한글 안내로 바꾼다', () => {
    expect(
      extractApiErrorMessage({
        error: { code: 'UJAT_VOLUNTEER_INTERVIEW_REQUIRED', message: 'UJAT_VOLUNTEER_INTERVIEW_REQUIRED' },
      })
    ).toBe('UJAT 봉사자 모집은 면접이 필수입니다. 면접 기간을 입력해 주세요.')
    expect(
      extractApiErrorMessage({
        error: {
          code: 'UJAT_ORGANIZATION_ALREADY_APPLIED',
          message: '같은 UJAT 프로그램에 이미 신청한 학교입니다.',
        },
      })
    ).toBe('같은 UJAT 프로그램에 이미 신청한 학교입니다.')
  })

  it('VOLUNTEER_INTERVIEW_CONFLICT는 평가 후 재배정 불가 안내로 바꾼다', () => {
    expect(
      extractApiErrorMessage({
        error: { code: 'VOLUNTEER_INTERVIEW_CONFLICT', message: 'VOLUNTEER_INTERVIEW_CONFLICT' },
      })
    ).toBe('면접 평가가 진행·완료된 신청은 재배정할 수 없습니다.')
  })

  it('교육구조 Guard 코드는 서버 영문보다 FE 한글 안내를 쓴다', () => {
    expect(
      extractApiErrorMessage({
        error: {
          code: 'PROGRAM_EDUCATION_STRUCTURE_CHANGE_BLOCKED',
          message: 'PROGRAM_EDUCATION_STRUCTURE_CHANGE_BLOCKED',
        },
      })
    ).toBe('이미 신청·배정 또는 교육 운영 이력이 있는 프로그램은 교육구조를 변경할 수 없습니다.')
  })

  it('RFC7807 detail 문자열을 상태 fallback보다 우선한다', () => {
    expect(
      extractApiErrorMessage(
        {
          type: 'about:blank',
          title: 'Conflict',
          status: 409,
          detail: '서류 합격 처리된 신청은 담당자 평가를 변경할 수 없습니다.',
        },
        { httpStatus: 409 }
      )
    ).toBe('서류 합격 처리된 신청은 담당자 평가를 변경할 수 없습니다.')
  })

  it('body.detail → error.detail → error.message 순으로 읽는다', () => {
    expect(
      extractApiErrorMessage(
        {
          success: false,
          message: 'fallback message',
          detail: '면접이 아직 종료되지 않았습니다.',
          error: {
            code: 'INTERVIEW_NOT_ENDED',
            message: 'nested message',
            detail: 'nested detail',
          },
        },
        { httpStatus: 409 }
      )
    ).toBe('면접이 아직 종료되지 않았습니다.')
    expect(
      extractApiErrorMessage({
        success: false,
        message: 'fallback message',
        error: {
          code: 'DOCUMENT_EVALUATION_LOCKED',
          message: 'nested message',
          detail: '서류 합격 처리된 신청은 담당자 평가를 변경할 수 없습니다.',
        },
      })
    ).toBe('서류 합격 처리된 신청은 담당자 평가를 변경할 수 없습니다.')
  })

  it('UJAT_WORKFLOW_STATE_CONFLICT는 field에 따라 안내를 구분한다', () => {
    expect(
      extractApiErrorMessage({
        success: false,
        error: { code: 'UJAT_WORKFLOW_STATE_CONFLICT', field: 'status' },
      })
    ).toBe('이미 수정 요청된 기관입니다. 교사 재제출 후 다시 시도해 주세요.')
    expect(
      extractApiErrorMessage({
        success: false,
        error: { code: 'UJAT_WORKFLOW_STATE_CONFLICT', field: 'temporaryAssignmentStatus' },
      })
    ).toBe('먼저 임시 일정을 배정하고 기관 확인을 완료해 주세요.')
  })

  it('UJAT_REGION_CLASS_CAPACITY_EXCEEDED는 details 정원·배정 예정 수를 안내한다', () => {
    expect(
      extractApiErrorMessage({
        success: false,
        message: '지역별 정원을 초과하여 배정할 수 없습니다.',
        error: {
          code: 'UJAT_REGION_CLASS_CAPACITY_EXCEEDED',
          message: '지역별 정원을 초과하여 배정할 수 없습니다.',
          field: 'educationRegionCode',
          details: {
            maxCount: '5',
            semesterType: 'SECOND_HALF',
            educationRegionCode: 'SEOUL',
            projectedCount: '6',
          },
        },
      })
    ).toBe(
      '서울 2학기 학급 정원(5개)을 초과합니다. (배정 예정 6개)\n학급 수를 줄이거나 다른 일정·지역으로 변경해 주세요.'
    )
    expect(
      extractApiErrorMessage({
        success: false,
        error: { code: 'UJAT_REGION_CLASS_CAPACITY_EXCEEDED' },
      })
    ).toBe('선택한 지역·반기의 잔여 학급 정원을 초과했습니다. 지역 또는 일정을 변경해 주세요.')
  })

  it('수료증 409는 범용 충돌 문구가 아니라 error.message를 쓴다', () => {
    expect(
      extractApiErrorMessage(
        {
          success: false,
          data: null,
          message: '수료증 발급 기간을 확인할 동의 또는 신청 정보가 없습니다.',
          error: {
            code: 'CERTIFICATE_CONSENT_EVIDENCE_UNAVAILABLE',
            message: '수료증 발급 기간을 확인할 동의 또는 신청 정보가 없습니다.',
          },
        },
        { httpStatus: 409, fallback: '요청한 변경이 기존 데이터와 충돌합니다.' }
      )
    ).toBe('수료증 발급 기간을 확인할 동의 또는 신청 정보가 없습니다.')
    expect(
      extractApiErrorMessage(
        {
          success: false,
          error: { code: 'CERTIFICATE_CONSENT_EVIDENCE_UNAVAILABLE', message: '' },
        },
        { httpStatus: 409 }
      )
    ).toBe('수료증 발급 기간을 확인할 동의 또는 신청 정보가 없습니다.')
  })
})

describe('getApiErrorCode / getApiErrorHttpStatus', () => {
  it('nested error.code와 HTTP status를 읽는다', () => {
    const error = {
      response: {
        status: 409,
        data: { error: { code: 'DETAILED_PROGRAM_IN_USE', message: '사용 중' } },
      },
    }
    expect(getApiErrorCode(error)).toBe('DETAILED_PROGRAM_IN_USE')
    expect(getApiErrorHttpStatus(error)).toBe(409)
  })
})

describe('isApiWorkflowConflictError', () => {
  it('409와 UJAT_WORKFLOW_STATE_CONFLICT를 충돌로 본다', () => {
    expect(
      isApiWorkflowConflictError({
        response: {
          status: 409,
          data: { error: { code: 'UJAT_WORKFLOW_STATE_CONFLICT', field: 'status' } },
        },
      })
    ).toBe(true)
    expect(
      isApiWorkflowConflictError({
        response: {
          status: 400,
          data: { error: { code: 'UJAT_WORKFLOW_STATE_CONFLICT', field: 'status' } },
        },
      })
    ).toBe(true)
  })

  it('네트워크 오류는 충돌이 아니다', () => {
    expect(isApiWorkflowConflictError(new Error('Network Error'))).toBe(false)
  })
})

describe('schedule line error codes', () => {
  it('코드만 있으면 FE 한글 안내를 쓴다', () => {
    expect(
      extractApiErrorMessage({
        success: false,
        error: { code: 'SCHEDULE_LINE_UNPARSEABLE' },
      })
    ).toBe('교육 일정 날짜/시간 형식을 해석할 수 없습니다. 날짜와 시간을 확인해 주세요.')
    expect(
      extractApiErrorMessage({
        success: false,
        error: { code: 'GENERAL_PROGRAM_ACTIVE_SCHEDULE_REQUIRED' },
      })
    ).toContain('유효한 교육 일정이 필요합니다')
  })
})
