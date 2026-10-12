import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import {
  mergeApplicantAvailabilityIntoSchedule,
  mergeRemoteSlotsIntoProgramSchedule,
  parseGeneralInterviewScheduleFromProgram,
  parseGeneralInterviewScheduleFromRemoteSlots,
} from './general-interview-assign-schedule-utils'
import { getSlotsForDate } from '@/features/program/ujat/ui/detail-modal/application-volunteer/screening/interview-assign/schedule-utils'

/** programId=186090 실측 payload (면접 기간·불가일·시간대) */
const program186090 = {
  id: '186090',
  generalCommonInfo: {
    volunteerRecruitmentInfo: {
      interviewStartDate: '2026-09-30T15:00:00.000Z',
      interviewEndDate: '2026-12-07T15:00:00.000Z',
    },
    volunteerInterviewScheduleInfo: {
      recurringUnavailable: '토요일, 일요일, 공휴일',
      specificUnavailableDates:
        '2026. 10. 07 (수), 2026. 10. 22 (목), 2026. 10. 20 (화), 2026. 10. 13 (화), 2026. 10. 30 (금), 2026. 11. 19 (목), 2026. 11. 10 (화), 2026. 11. 09 (월)',
      specificUnavailableDateIsos: [
        '2026-10-07',
        '2026-10-22',
        '2026-10-20',
        '2026-10-13',
        '2026-10-30',
        '2026-11-19',
        '2026-11-10',
        '2026-11-09',
      ],
      periodStartDate: '2026-10-01',
      periodEndDate: '2026-12-08',
      availableTimeSlots:
        '10:00 ~ 10:30, 10:30 ~ 11:00, 11:00 ~ 11:30, 11:30 ~ 12:00, 12:00 ~ 12:30, 12:30 ~ 13:00, 13:00 ~ 13:30, 13:30 ~ 14:00, 14:00 ~ 14:30, 14:30 ~ 15:00',
    },
  },
} as unknown as Program

describe('186090 interview assign schedule SSOT', () => {
  it('marks program available weekdays and excludes unavailable', () => {
    const holidays = new Set(['2026-10-03', '2026-10-09']) // 개천절·한글날
    const schedule = parseGeneralInterviewScheduleFromProgram(program186090, holidays)
    const oct = [...schedule.clickableDateKeys].filter(k => k.startsWith('2026-10-')).sort()

    expect(schedule.rangeStart.format('YYYY-MM-DD')).toBe('2026-10-01')
    expect(schedule.rangeEnd.format('YYYY-MM-DD')).toBe('2026-12-08')
    expect(schedule.clickableDateKeys.has('2026-10-12')).toBe(true)
    expect(schedule.clickableDateKeys.has('2026-10-09')).toBe(false) // 한글날
    expect(schedule.clickableDateKeys.has('2026-10-03')).toBe(false) // 개천절
    expect(schedule.clickableDateKeys.has('2026-10-10')).toBe(false) // Sat
    expect(schedule.clickableDateKeys.has('2026-10-11')).toBe(false) // Sun
    for (const d of [
      '2026-10-07',
      '2026-10-13',
      '2026-10-20',
      '2026-10-22',
      '2026-10-30',
    ]) {
      expect(schedule.clickableDateKeys.has(d)).toBe(false)
    }
    expect(oct).toEqual([
      '2026-10-01',
      '2026-10-02',
      '2026-10-05',
      '2026-10-06',
      '2026-10-08',
      '2026-10-12',
      '2026-10-14',
      '2026-10-15',
      '2026-10-16',
      '2026-10-19',
      '2026-10-21',
      '2026-10-23',
      '2026-10-26',
      '2026-10-27',
      '2026-10-28',
      '2026-10-29',
    ])
    expect(schedule.slotsByDateKey.get('2026-10-12')?.length).toBe(10)
  })

  it('keeps program clickable days when remote slots are empty and applicant only has 10/12', () => {
    const fromProgram = parseGeneralInterviewScheduleFromProgram(program186090)
    const fromRemote = parseGeneralInterviewScheduleFromRemoteSlots([])
    const merged = mergeApplicantAvailabilityIntoSchedule(
      mergeRemoteSlotsIntoProgramSchedule(fromProgram, fromRemote),
      [{ dateLabel: '2026. 10. 12 (월)', slots: ['10:00 ~ 10:30'] }]
    )

    expect(merged.clickableDateKeys.has('2026-10-12')).toBe(true)
    expect(merged.clickableDateKeys.has('2026-10-09')).toBe(true)
    expect(merged.clickableDateKeys.has('2026-10-13')).toBe(false)
    expect(merged.clickableDateKeys.size).toBe(fromProgram.clickableDateKeys.size)
  })

  it('exposes all program time slots on any program-available day (not applicant availability only)', () => {
    const schedule = parseGeneralInterviewScheduleFromProgram(program186090)
    const oct12 = getSlotsForDate(schedule, '2026-10-12', {
      interviewAvailability: [{ dateLabel: '2026. 10. 12 (월)', slots: ['10:00 ~ 10:30'] }],
    } as never)
    const oct21 = getSlotsForDate(schedule, '2026-10-21', {
      interviewAvailability: [{ dateLabel: '2026. 10. 12 (월)', slots: ['10:00 ~ 10:30'] }],
    } as never)
    expect(oct12.length).toBe(10)
    expect(oct21.length).toBe(10)
    expect(oct21[0]?.timeRange).toBe('10:00 ~ 10:30')
  })
})
