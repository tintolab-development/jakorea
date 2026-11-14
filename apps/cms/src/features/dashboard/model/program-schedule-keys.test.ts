import { describe, expect, it } from 'vitest'
import {
  parseAssignedProgramTypes,
  programScheduleKindToApiProgramType,
} from './program-schedule-keys'

describe('parseAssignedProgramTypes', () => {
  it('교육받은 교사는 별도 일정 위젯 kind다 (일반에 합치지 않음)', () => {
    expect(parseAssignedProgramTypes(['trained_teachers'])).toEqual(['trained_teacher'])
    expect(parseAssignedProgramTypes(['general', 'trained_teacher'])).toEqual([
      'general',
      'trained_teacher',
    ])
  })

  it('빈 배열은 담당 유형 없음, 필드 없음은 null', () => {
    expect(parseAssignedProgramTypes([])).toEqual([])
    expect(parseAssignedProgramTypes(undefined)).toBeNull()
  })
})

describe('programScheduleKindToApiProgramType', () => {
  it('교육받은 교사만 canonical 유형값으로 보낸다', () => {
    expect(programScheduleKindToApiProgramType('trained_teacher')).toBe('TRAINED_TEACHER')
    expect(programScheduleKindToApiProgramType('general')).toBe('general')
    expect(programScheduleKindToApiProgramType('gemini')).toBe('gemini')
  })
})
