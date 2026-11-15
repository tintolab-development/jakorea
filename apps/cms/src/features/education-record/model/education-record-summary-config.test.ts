import { describe, expect, it } from 'vitest'
import { SUMMARY_COLUMNS } from './education-record-summary-config'

describe('education-record-summary-config', () => {
  it('uses the confirmed summary column labels (same as excel summary sheet)', () => {
    expect(SUMMARY_COLUMNS.map(({ key, kind, label }) => [key, kind, label])).toEqual([
      ['schoolCount', '개수', '학교 수'],
      ['classCount', '개수', '학급 수'],
      ['participants', '합계', '총 참가자'],
      ['educationHours', '합계', '교육 시간'],
      ['generalVolunteers', '합계', '일반 자원봉사자'],
      ['staffVolunteers', '합계', '임직원 자원봉사자'],
      ['generalTeachers', '합계', '일반 담당교사'],
      ['educatedTeachers', '합계', '교육 받은 교사'],
      ['instructors', '합계', '강사'],
    ])
  })
})
