import { describe, expect, it } from 'vitest'
import { readProgramDraftItemResponse } from './program-draft-api-client'

describe('readProgramDraftItemResponse', () => {
  it('returns null for DATABASE_ERROR envelope', () => {
    expect(
      readProgramDraftItemResponse({
        success: false,
        data: null,
        message: '데이터 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
        error: { code: 'DATABASE_ERROR', message: '데이터 처리 중 오류가 발생했습니다.', field: null },
      })
    ).toBeNull()
  })

  it('returns null when data is missing', () => {
    expect(readProgramDraftItemResponse({ success: true, data: null })).toBeNull()
    expect(readProgramDraftItemResponse(null)).toBeNull()
  })

  it('reads wrapped draft item', () => {
    expect(
      readProgramDraftItemResponse({
        success: true,
        data: { draftId: 42, programType: 'TRAINED_TEACHER' },
      })
    ).toEqual({ draftId: 42, programType: 'TRAINED_TEACHER' })
  })
})
