import { describe, expect, it } from 'vitest'
import { formatGeminiRecruitmentSaveError } from './mutation-error'

describe('formatGeminiRecruitmentSaveError', () => {
  it('409 코드와 매핑 문구를 함께 보여 준다', () => {
    const error = {
      response: {
        status: 409,
        data: {
          success: false,
          error: { code: 'PROGRAM_PARTICIPANT_RECRUITMENT_EDIT_PERIOD_ENDED' },
        },
      },
    }
    expect(formatGeminiRecruitmentSaveError(error)).toBe(
      '모집 시작 이후에는 모집 정보를 수정할 수 없습니다.'
    )
  })
})
