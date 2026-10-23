import { describe, expect, it } from 'vitest'
import { parseAssignedProgramTypes } from './program-schedule-keys'

describe('parseAssignedProgramTypes', () => {
  it('교육받은 교사는 일반 일정 위젯 kind로 합친다', () => {
    expect(parseAssignedProgramTypes(['trained_teachers'])).toEqual(['general'])
    expect(parseAssignedProgramTypes(['general', 'trained_teachers'])).toEqual(['general'])
  })
})
