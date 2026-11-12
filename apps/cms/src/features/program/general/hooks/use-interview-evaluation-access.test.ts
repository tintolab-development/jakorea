import { describe, expect, it } from 'vitest'
import { isMyProgramPmAssignment } from './use-interview-evaluation-access'

describe('isMyProgramPmAssignment', () => {
  it('본인 배정 역할이 PM일 때만 true', () => {
    expect(isMyProgramPmAssignment({ assigned: true, assignmentRole: 'PM' })).toBe(true)
    expect(isMyProgramPmAssignment({ assigned: true, assignmentRole: 'pm' })).toBe(true)
  })

  it('PARTNER·VIEWER·미배정·응답 없음은 false', () => {
    expect(isMyProgramPmAssignment({ assigned: true, assignmentRole: 'PARTNER' })).toBe(false)
    expect(isMyProgramPmAssignment({ assigned: true, assignmentRole: 'VIEWER' })).toBe(false)
    expect(isMyProgramPmAssignment({ assigned: false, assignmentRole: 'PM' })).toBe(false)
    expect(isMyProgramPmAssignment({ assigned: true, assignmentRole: null, masterBypass: true })).toBe(false)
    expect(isMyProgramPmAssignment(null)).toBe(false)
  })
})
