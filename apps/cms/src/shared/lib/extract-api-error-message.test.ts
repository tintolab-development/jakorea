import { describe, expect, it } from 'vitest'
import {
  extractApiErrorMessage,
  formatApiErrorAlertContent,
  getApiErrorCode,
  getApiErrorHttpStatus,
  isApiWorkflowConflictError,
} from './extract-api-error-message'

describe('extractApiErrorMessage', () => {
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
