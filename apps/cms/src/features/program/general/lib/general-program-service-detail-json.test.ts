import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import {
  toKstDateKey,
  withVolunteerInterviewSchedulePeriod,
} from './general-program-service-detail-json'

describe('toKstDateKey', () => {
  it('UTC ISO를 KST 날짜로 바꾼다', () => {
    expect(toKstDateKey('2026-10-31T15:00:00.000Z')).toBe('2026-11-01')
    expect(toKstDateKey('2026-11-01T14:59:59.000Z')).toBe('2026-11-01')
  })

  it('YYYY-MM-DD는 그대로, 빈 값은 undefined', () => {
    expect(toKstDateKey('2026-11-02')).toBe('2026-11-02')
    expect(toKstDateKey('')).toBeUndefined()
    expect(toKstDateKey(undefined)).toBeUndefined()
    expect(toKstDateKey('not-a-date')).toBeUndefined()
  })
})

describe('withVolunteerInterviewSchedulePeriod', () => {
  const schedule = { availableTimeSlots: '10:00 ~ 10:30', recurringUnavailable: '공휴일' }

  it('봉사자 2차 면접 심사 기간을 periodStartDate/periodEndDate로 싣는다', () => {
    const program = {} as Program
    const common = {
      volunteerRecruitmentInfo: {
        interviewStartDate: '2026-10-31T15:00:00.000Z',
        interviewEndDate: '2026-11-01T15:00:00.000Z',
      },
      volunteerInterviewScheduleInfo: schedule,
    } as Program['generalCommonInfo']

    expect(
      withVolunteerInterviewSchedulePeriod(program, common)?.volunteerInterviewScheduleInfo
    ).toEqual({ ...schedule, periodStartDate: '2026-11-01', periodEndDate: '2026-11-02' })
  })

  it('수정 폼에서 바뀐 루트 기간을 우선한다', () => {
    const program = {
      interviewStartDate: '2026-11-04T15:00:00.000Z',
      interviewEndDate: '2026-11-05T15:00:00.000Z',
    } as Program
    const common = {
      volunteerRecruitmentInfo: {
        interviewStartDate: '2026-10-31T15:00:00.000Z',
        interviewEndDate: '2026-11-01T15:00:00.000Z',
      },
      volunteerInterviewScheduleInfo: schedule,
    } as Program['generalCommonInfo']

    expect(
      withVolunteerInterviewSchedulePeriod(program, common)?.volunteerInterviewScheduleInfo
    ).toMatchObject({ periodStartDate: '2026-11-05', periodEndDate: '2026-11-06' })
  })

  it('기간을 비우면 이전 period를 지워 BE가 모집 기간으로 폴백한다', () => {
    const common = {
      volunteerInterviewScheduleInfo: {
        ...schedule,
        periodStartDate: '2026-11-01',
        periodEndDate: '2026-11-02',
      },
    } as Program['generalCommonInfo']

    expect(
      withVolunteerInterviewSchedulePeriod({} as Program, common)?.volunteerInterviewScheduleInfo
    ).toEqual(schedule)
  })

  it('면접 일정 정보가 없으면 건드리지 않는다', () => {
    const common = {
      volunteerRecruitmentInfo: { interviewStartDate: '2026-11-01' },
    } as Program['generalCommonInfo']
    expect(withVolunteerInterviewSchedulePeriod({} as Program, common)).toBe(common)
  })
})
