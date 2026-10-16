import { describe, expect, it } from 'vitest'
import { TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE } from '@/features/template/lib/template-form-select-options'
import {
  isDetailedProgramMasterId,
  omitIfDetailedProgramNameAlias,
  omitMirroredDetailedProgramMasterIdFromCommonInfo,
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
    expect(parseDetailedProgramMasterId('__economy_1c1s_main__')).toBeUndefined()
    expect(parseDetailedProgramMasterId('__ujat_volunteer_core__')).toBeUndefined()
  })
})

describe('isDetailedProgramMasterId', () => {
  it('accepts numeric catalog ids only', () => {
    expect(isDetailedProgramMasterId('163006')).toBe(true)
    expect(isDetailedProgramMasterId(163006)).toBe(true)
    expect(isDetailedProgramMasterId(TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE)).toBe(false)
    expect(isDetailedProgramMasterId('__economy_1c1s_main__')).toBe(false)
    expect(isDetailedProgramMasterId('해당없음')).toBe(false)
    expect(isDetailedProgramMasterId('')).toBe(false)
    expect(isDetailedProgramMasterId(undefined)).toBe(false)
  })
})

describe('omitMirroredDetailedProgramMasterIdFromCommonInfo', () => {
  it('removes BE-mirrored detailedProgramId from commonInfo', () => {
    const next = omitMirroredDetailedProgramMasterIdFromCommonInfo({
      detailedProgramName: '일정 A',
      detailedProgramId: 163006,
    } as never)
    expect(next).toEqual({ detailedProgramName: '일정 A' })
    expect(Object.prototype.hasOwnProperty.call(next, 'detailedProgramId')).toBe(false)
  })
})

describe('omitIfDetailedProgramNameAlias', () => {
  it('does not send detailed program name as textbookName', () => {
    expect(omitIfDetailedProgramNameAlias('사회공헌 프로젝트', '사회공헌 프로젝트')).toBeUndefined()
    expect(omitIfDetailedProgramNameAlias('해당없음', '해당없음')).toBeUndefined()
    expect(omitIfDetailedProgramNameAlias('성공하는 경제생활', '사회공헌 프로젝트')).toBe(
      '성공하는 경제생활'
    )
    expect(
      omitIfDetailedProgramNameAlias(
        '필요와 욕구, 현명한 소비',
        '해당없음',
        ['필요와 욕구, 현명한 소비']
      )
    ).toBeUndefined()
  })
})
