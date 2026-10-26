import { describe, expect, it } from 'vitest'
import { hasProgramAssignmentHistory } from './has-program-assignment-history'

describe('hasProgramAssignmentHistory', () => {
  it('과거 포함 담당 프로그램 수가 있으면 true', () => {
    expect(hasProgramAssignmentHistory({ listMetrics: { managedProgramCount: 1 } })).toBe(true)
  })

  it('담당 프로그램 수가 없거나 0이면 false', () => {
    expect(hasProgramAssignmentHistory({ listMetrics: { managedProgramCount: 0 } })).toBe(false)
    expect(hasProgramAssignmentHistory({ listMetrics: undefined })).toBe(false)
  })
})
