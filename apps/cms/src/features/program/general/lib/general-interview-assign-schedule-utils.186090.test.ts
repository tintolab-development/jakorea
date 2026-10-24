import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import type { GeneralInterviewSlotListItem } from '@/features/program/general/api/admin-applications-service'
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
        '2026.10.07(수), 2026.10.22(목), 2026.10.20(화), 2026.10.13(화), 2026.10.30(금), 2026.11.19(목), 2026.11.10(화), 2026.11.09(월)',
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

  it('limits available dates to the applicant availability', () => {
    const fromProgram = parseGeneralInterviewScheduleFromProgram(program186090)
    const fromRemote = parseGeneralInterviewScheduleFromRemoteSlots([])
    const merged = mergeApplicantAvailabilityIntoSchedule(
      mergeRemoteSlotsIntoProgramSchedule(fromProgram, fromRemote),
      [{ dateLabel: '2026.10.12(월)', slots: ['10:00 ~ 10:30'] }]
    )

    expect(merged.clickableDateKeys.has('2026-10-12')).toBe(true)
    expect(merged.clickableDateKeys.has('2026-10-09')).toBe(false)
    expect(merged.clickableDateKeys.has('2026-10-13')).toBe(false)
    expect(merged.clickableDateKeys.size).toBe(1)
    expect(merged.slotsByDateKey.get('2026-10-12')?.map(slot => slot.timeRange)).toEqual([
      '10:00 ~ 10:30',
    ])
  })

  it('limits time slots to the applicant availability on each date', () => {
    const schedule = parseGeneralInterviewScheduleFromProgram(program186090)
    const restricted = mergeApplicantAvailabilityIntoSchedule(schedule, [
      { dateLabel: '2026.10.12(월)', slots: ['10:00 ~ 10:30'] },
      { dateLabel: '2026.10.21(수)', slots: ['13:00 ~ 13:30'] },
    ])
    const oct12 = getSlotsForDate(restricted, '2026-10-12')
    const oct21 = getSlotsForDate(restricted, '2026-10-21')
    expect(oct12.map(slot => slot.timeRange)).toEqual(['10:00 ~ 10:30'])
    expect(oct21.map(slot => slot.timeRange)).toEqual(['13:00 ~ 13:30'])
  })
})

/** programId=186251 interview-slots. 주말·지정 불가일에도 서버 슬롯이 있다. */
const slots186251: GeneralInterviewSlotListItem[] = [
  {
    interviewSlotId: 1695171,
    slotDate: '2026-11-01',
    startAt: '2026-11-01T13:40:00Z',
    endAt: '2026-11-01T14:10:00Z',
    maxAssignCount: 5,
    assignedCount: 0,
    exceptionSlot: false,
  },
  {
    interviewSlotId: 1695172,
    slotDate: '2026-11-01',
    startAt: '2026-11-01T14:10:00Z',
    endAt: '2026-11-01T14:40:00Z',
    maxAssignCount: 5,
    assignedCount: 0,
    exceptionSlot: false,
  },
  {
    interviewSlotId: 1695173,
    slotDate: '2026-11-02',
    startAt: '2026-11-02T13:40:00Z',
    endAt: '2026-11-02T14:10:00Z',
    maxAssignCount: 5,
    assignedCount: 0,
    exceptionSlot: false,
  },
  {
    interviewSlotId: 1695146,
    slotDate: '2026-11-20',
    startAt: '2026-11-20T13:40:00Z',
    endAt: '2026-11-20T14:10:00Z',
    maxAssignCount: 5,
    assignedCount: 0,
    exceptionSlot: false,
  },
  {
    interviewSlotId: 1695148,
    slotDate: '2026-11-21',
    startAt: '2026-11-21T02:40:00Z',
    endAt: '2026-11-21T03:40:00Z',
    maxAssignCount: 5,
    assignedCount: 0,
    exceptionSlot: false,
  },
]

const programBlockingWeekendAndNov20 = {
  id: '186251',
  generalCommonInfo: {
    volunteerRecruitmentInfo: {
      interviewStartDate: '2026-11-01',
      interviewEndDate: '2026-11-21',
    },
    volunteerInterviewScheduleInfo: {
      recurringUnavailable: '토요일, 일요일, 공휴일',
      specificUnavailableDates: '2026.11.20(금)',
      specificUnavailableDateIsos: ['2026-11-20'],
      periodStartDate: '2026-11-01',
      periodEndDate: '2026-11-21',
      availableTimeSlots: '10:00 ~ 10:30',
    },
  },
} as unknown as Program

describe('186251 remote interview slots', () => {
  it('keeps server slot dates that the program text marks unavailable', () => {
    const fromProgram = parseGeneralInterviewScheduleFromProgram(programBlockingWeekendAndNov20)
    expect(fromProgram.clickableDateKeys.has('2026-11-01')).toBe(false)
    expect(fromProgram.clickableDateKeys.has('2026-11-20')).toBe(false)
    expect(fromProgram.clickableDateKeys.has('2026-11-21')).toBe(false)

    const merged = mergeRemoteSlotsIntoProgramSchedule(
      fromProgram,
      parseGeneralInterviewScheduleFromRemoteSlots(slots186251)
    )

    expect([...merged.clickableDateKeys].sort()).toEqual([
      '2026-11-01',
      '2026-11-02',
      '2026-11-20',
      '2026-11-21',
    ])
    expect(merged.slotsByDateKey.get('2026-11-01')?.map(slot => slot.timeRange)).toEqual([
      '22:40 ~ 23:10',
      '23:10 ~ 23:40',
    ])
    expect(merged.slotsByDateKey.get('2026-11-21')?.map(slot => slot.timeRange)).toEqual([
      '11:40 ~ 12:40',
    ])
    expect(getSlotsForDate(merged, '2026-11-01').map(slot => slot.displayTimeRange)).toEqual([
      '22:40 - 23:10',
      '23:10 - 23:40',
    ])
  })

  it('keeps only the applicant times that exist on the server slots', () => {
    const fromProgram = parseGeneralInterviewScheduleFromProgram(programBlockingWeekendAndNov20)
    const merged = mergeApplicantAvailabilityIntoSchedule(
      mergeRemoteSlotsIntoProgramSchedule(
        fromProgram,
        parseGeneralInterviewScheduleFromRemoteSlots(slots186251)
      ),
      [{ dateLabel: '26. 11. 01(일)', slots: ['22:40 ~ 23:10', '10:00 ~ 10:30'] }]
    )

    expect([...merged.clickableDateKeys]).toEqual(['2026-11-01'])
    expect(getSlotsForDate(merged, '2026-11-01').map(slot => slot.timeRange)).toEqual([
      '22:40 ~ 23:10',
    ])
  })
})
