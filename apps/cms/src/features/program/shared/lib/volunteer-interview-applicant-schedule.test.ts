import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'
import { buildVolunteerInterviewTimeSlots, parseVolunteerInterviewApplicantScheduleFromSeed } from './volunteer-interview-applicant-schedule'

describe('봉사자 면접 신청 가능 일정', () => {
  const range: [ReturnType<typeof dayjs>, ReturnType<typeof dayjs>] = [
    dayjs('2026-03-06T09:00:00'),
    dayjs('2026-03-06T10:00:00'),
  ]

  it.each([
    ['15', 4],
    ['30', 2],
    ['60', 1],
  ] as const)('시간 단위 %s 변경 시 슬롯을 재생성한다', (unit, expectedCount) => {
    expect(buildVolunteerInterviewTimeSlots(range, unit)).toHaveLength(expectedCount)
  })

  it('관리자 불가일은 신청 가능 날짜에서 제외한다', () => {
    const parsed = parseVolunteerInterviewApplicantScheduleFromSeed(
      {
        excludeNone: false,
        excludeSaturday: false,
        excludeSunday: false,
        excludeHoliday: false,
        appliedUnavailableDates: ['2026-03-06'],
        selectedTimeSlotLabels: ['09:00 ~ 09:30'],
        interviewTimeRange: { startHour: 9, startMinute: 0, endHour: 10, endMinute: 0 },
        timeUnit: '30',
      },
      { rangeStart: dayjs('2026-03-06'), rangeEnd: dayjs('2026-03-13') }
    )

    expect(parsed.clickableDateKeys.has('2026-03-06')).toBe(false)
    expect(parsed.clickableDateKeys.has('2026-03-13')).toBe(true)
    expect(parsed.slotsForDate('2026-03-06')).toEqual([])
  })
})
