import { describe, expect, it } from 'vitest'
import {
  formatTrainedTeachersRecruitmentPeriodLabel,
  formatTrainedTeachersStudentListLabel,
} from './recruitment-display-labels'

describe('교육받은 교사 모집 정보 표시', () => {
  it('모집 기간은 양쪽 날짜에 요일을 붙이고 시각을 뺀다', () => {
    expect(formatTrainedTeachersRecruitmentPeriodLabel('2026.11.08(일) ~ 2026.11.09 23:59')).toBe(
      '2026.11.08(일) ~ 2026.11.09(월)'
    )
    expect(formatTrainedTeachersRecruitmentPeriodLabel('-')).toBe('-')
  })

  it('학생 명단 제출 여부는 필요/불필요', () => {
    expect(formatTrainedTeachersStudentListLabel('제출 필요')).toBe('필요')
    expect(formatTrainedTeachersStudentListLabel('제출 불필요')).toBe('불필요')
    expect(formatTrainedTeachersStudentListLabel('-')).toBe('-')
  })
})
