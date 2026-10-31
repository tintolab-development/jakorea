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
    ).toBe('3행: 동일 이름·연락처 강사가 여러 명입니다.')
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
    ).toBe('1행: 강사 정보 미기재 (실적만 등록, 지급 없음)')
  })

  it('does not treat NOT_MATCHED SUCCESS as a preview failure; notes include label', () => {
    expect(
      formatGeminiImportPreviewFailures([
        {
          status: 'SUCCESS',
          rowNumber: 1,
          message:
            '일치하는 강사 회원을 찾지 못해 실적만 등록하고 계좌 지급·정산 대상에서 제외했습니다.',
          trainingReportId: 186512,
          accountPaymentId: undefined,
          matchedInstructorMemberId: undefined,
          paymentExclusionReason: 'GEMINI_INSTRUCTOR_NOT_MATCHED',
        },
      ]),
    ).toBeUndefined()
    expect(
      formatGeminiImportPaymentExclusionNotes([
        {
          status: 'SUCCESS',
          rowNumber: 1,
          paymentExclusionReason: 'GEMINI_INSTRUCTOR_NOT_MATCHED',
        },
      ]),
    ).toBe('1행: 강사 회원 미매칭 (실적만 등록, 지급·정산 없음)')
  })

  it('does not show axios status 400 as the user message', () => {
    const error = new Error('Request failed with status code 400')
    expect(formatGeminiApiError(error, '실적 등록에 실패했습니다.')).toBe(
      '실적 등록에 실패했습니다.',
    )
  })
})
