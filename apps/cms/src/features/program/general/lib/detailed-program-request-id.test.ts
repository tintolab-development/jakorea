import { describe, expect, it } from 'vitest'
import { TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE } from '@/features/template/lib/template-form-select-options'
import {
  omitIfDetailedProgramNameAlias,
  parseDetailedProgramMasterId,
} from './detailed-program-request-id'

describe('parseDetailedProgramMasterId', () => {
  it('parses numeric catalog ids', () => {
    expect(parseDetailedProgramMasterId('163006')).toBe(163006)
    expect(parseDetailedProgramMasterId(163006)).toBe(163006)
  })

  it('drops 해당없음 and non-master values', () => {
    expect(parseDetailedProgramMasterId(TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE)).toBeUndefined()
    expect(parseDetailedProgramMasterId('')).toBeUndefined()
    expect(parseDetailedProgramMasterId('detail-1')).toBeUndefined()
  })
})

describe('omitIfDetailedProgramNameAlias', () => {
  it('does not send detailed program name as textbookName', () => {
    expect(omitIfDetailedProgramNameAlias('사회공헌 프로젝트', '사회공헌 프로젝트')).toBeUndefined()
    expect(omitIfDetailedProgramNameAlias('해당없음', '해당없음')).toBeUndefined()
    expect(omitIfDetailedProgramNameAlias('성공하는 경제생활', '사회공헌 프로젝트')).toBe(
      '성공하는 경제생활'
    )
  })
})
