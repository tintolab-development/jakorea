import { describe, expect, it } from 'vitest'
import { hasProgramAssignmentHistory } from './has-program-assignment-history'

describe('hasProgramAssignmentHistory', () => {
  it('BE 담당 배정 이력이 true면 true', () => {
    expect(hasProgramAssignmentHistory({ listMetrics: { hasProgramAssignmentHistory: true } })).toBe(
      true
    )
  })

  it('BE 이력이 false면 담당 프로그램 수가 있어도 false', () => {
    expect(
      hasProgramAssignmentHistory({
        listMetrics: { hasProgramAssignmentHistory: false, managedProgramCount: 3 },
      })
    ).toBe(false)
  })

  it('BE 이력 필드가 없으면 false', () => {
    expect(hasProgramAssignmentHistory({ listMetrics: { managedProgramCount: 1 } })).toBe(false)
    expect(hasProgramAssignmentHistory({ listMetrics: undefined })).toBe(false)
  })
})
