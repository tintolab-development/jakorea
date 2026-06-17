import { describe, expect, it } from 'vitest'
import {
  formatIndividualInstructorEducationScheduleLabel,
  formatLectureReportSubmissionDeadline,
} from './participating-individual-instructor-lecture-report-display'

describe('participating-individual-instructor-lecture-report-display', () => {
  it('강의일 기준 익월 5일 마감을 표시한다', () => {
    expect(formatLectureReportSubmissionDeadline('2026-01-05')).toBe('2026. 02. 05(목)까지')
    expect(formatLectureReportSubmissionDeadline('2026-01-26')).toBe('2026. 02. 05(목)까지')
  })

  it('교육 진행 일정 라벨을 날짜·시간·회차명 조합으로 만든다', () => {
    expect(
      formatIndividualInstructorEducationScheduleLabel({
        dateKey: '2026-01-05',
        timeRange: '09:20 ~ 12:00',
        sessionName: '1회차',
      })
    ).toBe('2026. 01. 05(월) 09:20 ~ 12:00 | 1회차')
  })

  it('회차명 없이 날짜와 시간만 표시할 수 있다', () => {
    expect(
      formatIndividualInstructorEducationScheduleLabel({
        dateKey: '2026-04-03',
        timeRange: '14:00 ~ 16:00',
      })
    ).toBe('2026. 04. 03(금) 14:00 ~ 16:00')
  })

  it('일정명만 있는 경우 날짜와 일정명을 표시한다', () => {
    expect(
      formatIndividualInstructorEducationScheduleLabel({
        dateKey: '2026-04-03',
        sessionName: '오리엔테이션',
      })
    ).toBe('2026. 04. 03(금) | 오리엔테이션')
  })
})
