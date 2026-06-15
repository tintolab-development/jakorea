import { describe, expect, it } from 'vitest'
import {
  formatParticipatingInstructorAssignedInstitutions,
  formatParticipatingInstructorHomeAddress,
} from './participating-instructors-table-display'

describe('formatParticipatingInstructorHomeAddress', () => {
  it('시/도·시/군/구까지만 표시한다', () => {
    expect(formatParticipatingInstructorHomeAddress('서울특별시 강서구 화곡동 123-45')).toBe(
      '서울특별시 강서구'
    )
  })

  it('값이 없으면 -를 반환한다', () => {
    expect(formatParticipatingInstructorHomeAddress()).toBe('-')
  })
})

describe('formatParticipatingInstructorAssignedInstitutions', () => {
  it('배정 기관이 없으면 -를 반환한다', () => {
    expect(formatParticipatingInstructorAssignedInstitutions([])).toBe('-')
  })

  it('가나다순 첫 기관 + 외 N개를 반환한다', () => {
    expect(
      formatParticipatingInstructorAssignedInstitutions(['진월초등학교', '강서초등학교', '마포초등학교'])
    ).toBe('강서초등학교 외 2개')
  })
})
