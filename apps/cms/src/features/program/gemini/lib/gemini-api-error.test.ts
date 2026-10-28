import { describe, expect, it } from 'vitest'
import { formatGeminiApiError } from './gemini-api-error'
import { formatGeminiImportPreviewFailures } from './performance/import-preview-failure'

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
      '종료 시간은 시작 시간 이후여야 합니다.'
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
      '종료 시간은 시작 시간 이후여야 합니다.'
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
    ).toBe('2행: 종료 시간은 시작 시간 이후여야 합니다.')
  })
})
