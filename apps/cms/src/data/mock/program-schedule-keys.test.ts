import { describe, expect, it } from 'vitest'
import { parseAssignedProgramTypes } from './program-schedule-keys'

describe('parseAssignedProgramTypes', () => {
  it('필드가 없으면 ACL 폴백을 위해 null이다', () => {
    expect(parseAssignedProgramTypes(undefined)).toBeNull()
    expect(parseAssignedProgramTypes(null)).toBeNull()
  })

  it('빈 배열은 담당 유형 없음이다', () => {
    expect(parseAssignedProgramTypes([])).toEqual([])
  })

  it('OpenAPI 키와 별칭을 일정 위젯 순서로 정규화한다', () => {
    expect(parseAssignedProgramTypes(['UJAT', 'general', '1c1s', 'gemini'])).toEqual([
      'general',
      'company_school',
      'ujat',
      'gemini',
    ])
  })

  it('알 수 없는 값만 있으면 빈 목록이다', () => {
    expect(parseAssignedProgramTypes(['unknown'])).toEqual([])
  })
})
