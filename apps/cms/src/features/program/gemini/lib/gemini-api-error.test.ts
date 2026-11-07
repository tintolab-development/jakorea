import { describe, expect, it } from 'vitest'
import { formatGeminiApiError } from './gemini-api-error'
import {
  formatGeminiImportPaymentExclusionNotes,
  formatGeminiImportPreviewFailures,
} from './performance/import-preview-failure'

describe('formatGeminiApiError', () => {
  it('maps GEMINI_TRAINING_END_TIME_NOT_AFTER_START to Korean copy', () => {
    const error = {
      response: {
        status: 400,
        data: {
          success: false,
          error: { code: 'GEMINI_TRAINING_END_TIME_NOT_AFTER_START' },
        },
      },
    }
    expect(formatGeminiApiError(error, '실적 등록에 실패했습니다.')).toBe(
      '종료 시각이 시작 시각보다 늦어야 합니다.'
    )
  })

  it('does not expose a raw error code as the user message', () => {
    const error = {
      response: {
        status: 400,
        data: {
          success: false,
          message: 'GEMINI_TRAINING_END_TIME_NOT_AFTER_START',
        },
      },
    }
    expect(formatGeminiApiError(error, '실적 등록에 실패했습니다.')).toBe(
      '종료 시각이 시작 시각보다 늦어야 합니다.'
    )
  })

  it('maps import preview row messages that contain the code', () => {
    expect(
      formatGeminiImportPreviewFailures([
        {
          status: 'FAILED',
          rowNumber: 2,
          message: 'GEMINI_TRAINING_END_TIME_NOT_AFTER_START',
        },
      ]),
    ).toBe('2행: 종료 시각이 시작 시각보다 늦어야 합니다.')
  })

  it('maps GEMINI_INSTRUCTOR_MATCH_AMBIGUOUS separately from not matched', () => {
    expect(
      formatGeminiImportPreviewFailures([
        {
          status: 'FAILED',
          rowNumber: 3,
          message: 'GEMINI_INSTRUCTOR_MATCH_AMBIGUOUS',
        },
      ]),
    ).toBe(
      '3행: 동일한 이름과 연락처의 강사가 여러 명입니다. 정확한 강사 회원을 선택해 주세요.',
    )
  })

  it('does not treat IDENTITY_BLANK SUCCESS as a preview failure', () => {
    expect(
      formatGeminiImportPreviewFailures([
        {
          status: 'SUCCESS',
          rowNumber: 1,
          message: '강사 정보가 미기재되어 실적만 등록하고 계좌 지급 대상에서 제외했습니다.',
          paymentExclusionReason: 'GEMINI_INSTRUCTOR_IDENTITY_BLANK',
          matchedInstructorMemberId: undefined,
          accountPaymentId: undefined,
        },
      ]),
    ).toBeUndefined()
    expect(
      formatGeminiImportPaymentExclusionNotes([
        {
          status: 'SUCCESS',
          rowNumber: 1,
          paymentExclusionReason: 'GEMINI_INSTRUCTOR_IDENTITY_BLANK',
        },
      ]),
    ).toBe('1행: 강사 정보 미기재 (실적만 등록, 계좌 지급 제외)')
  })

  it('treats NOT_MATCHED as a failed row even if a stale server sends SUCCESS', () => {
    expect(
      formatGeminiImportPreviewFailures([
        {
          status: 'SUCCESS',
          rowNumber: 1,
          message: 'GEMINI_INSTRUCTOR_NOT_MATCHED: 입력한 강사명·연락처가 회원 정보와 일치하지 않습니다.',
          trainingReportId: 186512,
          accountPaymentId: undefined,
          matchedInstructorMemberId: undefined,
          paymentExclusionReason: 'GEMINI_INSTRUCTOR_NOT_MATCHED' as never,
        },
      ]),
    ).toBe('1행: 입력한 강사명·연락처가 회원 정보와 일치하지 않습니다.')
    expect(
      formatGeminiImportPaymentExclusionNotes([
        {
          status: 'SUCCESS',
          rowNumber: 1,
          paymentExclusionReason: 'GEMINI_INSTRUCTOR_NOT_MATCHED' as never,
        },
      ]),
    ).toBeUndefined()
  })

  it('shows external-payee SUCCESS as performance-only', () => {
    expect(
      formatGeminiImportPaymentExclusionNotes([
        {
          status: 'SUCCESS',
          rowNumber: 4,
          paymentExclusionReason: 'GEMINI_INSTRUCTOR_EXTERNAL_PAYEE',
        },
      ]),
    ).toBe('4행: 외부 지급처 (실적만 등록, 계좌 지급 제외)')
  })

  it('maps identity mismatch and partial identity failures', () => {
    expect(
      formatGeminiImportPreviewFailures([
        {
          status: 'FAILED',
          rowNumber: 5,
          message: 'GEMINI_INSTRUCTOR_IDENTITY_MISMATCH: 불일치',
        },
        {
          status: 'FAILED',
          rowNumber: 6,
          message: 'GEMINI_INSTRUCTOR_NAME_AND_PHONE_REQUIRED: 부분 입력',
        },
      ]),
    ).toBe(
      '5행: 선택한 강사 회원과 입력한 강사명·연락처가 일치하지 않습니다.\n6행: 강사명과 연락처를 입력해 주세요.',
    )
  })

  it('does not show axios status 400 as the user message', () => {
    const error = new Error('Request failed with status code 400')
    expect(formatGeminiApiError(error, '실적 등록에 실패했습니다.')).toBe(
      '실적 등록에 실패했습니다.',
    )
  })

  it('maps approved-training history conflicts to the delete-blocked copy', () => {
    expect(
      formatGeminiApiError(
        {
          response: {
            status: 409,
            data: { error: { code: 'GEMINI_APPROVED_TRAINING_HAS_BUSINESS_HISTORY' } },
          },
        },
        '연수 삭제에 실패했습니다.'
      )
    ).toBe('신청 강사 또는 교육 진행 이력이 있는 연수는 삭제할 수 없습니다.')
  })
})
