import { describe, expect, it } from 'vitest'
import type { ApplicantInstructorRow } from '@/features/program/shared/model/applicant-instructor'
import {
  getInstructorCalendarRoundLabel,
  getInstructorCalendarSessionCardLabel,
  getInstructorCalendarSessionSummary,
} from './applicant-instructor-calendar-session'

function instructor(rank: number | undefined): ApplicantInstructorRow {
  return {
    preferredSchools: [
      {
        schoolId: 's-1',
        schoolName: '제이초',
        rank,
        assignable: true,
        grade: '3학년',
        dateRange: '2026.04.20 (월) 09:20 ~ 11:20',
      },
    ],
  } as unknown as ApplicantInstructorRow
}

describe('applicant-instructor-calendar-session — 희망 기관 순위는 지망', () => {
  it('희망 순위를 차시가 아니라 N지망으로 쓴다', () => {
    expect(getInstructorCalendarSessionSummary(instructor(2), '제이초')).toBe('2지망 09:20~11:20')
    expect(getInstructorCalendarSessionCardLabel(instructor(2), '제이초')).toBe('2지망 (09:20 ~ 11:20)')
    expect(getInstructorCalendarRoundLabel(instructor(2), '제이초')).toBe('2지망')
  })

  it('순위가 없으면 1차시를 지어내지 않고 시간만', () => {
    expect(getInstructorCalendarSessionSummary(instructor(undefined), '제이초')).toBe('09:20~11:20')
    expect(getInstructorCalendarSessionCardLabel(instructor(undefined), '제이초')).toBe('09:20 ~ 11:20')
    expect(getInstructorCalendarRoundLabel(instructor(undefined), '제이초')).toBe('-')
  })
})
