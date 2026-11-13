import { describe, expect, it } from 'vitest'
import { buildCompanySchoolInstructorAvailableScheduleLines } from './instructor-available-schedule-lines'

describe('buildCompanySchoolInstructorAvailableScheduleLines', () => {
  it('강사가 고른 희망 일정을 날짜·시간 순으로 표시한다', () => {
    expect(
      buildCompanySchoolInstructorAvailableScheduleLines({
        preferredScheduleSlots: [
          {
            slotKey: '2',
            assignable: true,
            startAt: '2026-11-27T10:00:00+09:00',
            endAt: '2026-11-27T11:00:00+09:00',
          },
          {
            slotKey: '1',
            assignable: true,
            startAt: '2026-11-20T09:00:00+09:00',
            endAt: '2026-11-20T10:00:00+09:00',
          },
        ],
      })
    ).toEqual(['2026년 11월 20일 (09:00 ~ 10:00)', '2026년 11월 27일 (10:00 ~ 11:00)'])
  })

  it('일정이 없으면 빈 배열', () => {
    expect(buildCompanySchoolInstructorAvailableScheduleLines({ preferredScheduleSlots: [] })).toEqual([])
    expect(buildCompanySchoolInstructorAvailableScheduleLines(null)).toEqual([])
  })
})
