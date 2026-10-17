import { describe, expect, it } from 'vitest'
import {
  hasAssignableOrganizationInstructorSchedule,
  resolveAssignableSchedulePayloadFromSession,
} from './organization-instructor-assignable-schedule'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'

function session(
  partial: Partial<ParticipatingSchoolSession> & Pick<ParticipatingSchoolSession, 'round' | 'date'>
): ParticipatingSchoolSession {
  return {
    dayOfWeek: '월',
    duration: '1차시',
    format: '단독',
    timeRange: '09:00 ~ 10:00',
    classNum: '1차시',
    status: 'pending',
    ...partial,
  }
}

describe('resolveAssignableSchedulePayloadFromSession', () => {
  it('resolvedScheduleId가 있으면 scheduleId로 배정한다', () => {
    expect(
      resolveAssignableSchedulePayloadFromSession(
        session({ round: 1, date: '2026.10.01', resolvedScheduleId: 186674 })
      )
    ).toEqual({ scheduleId: 186674 })
  })

  it('requestedScheduleId만 있으면 requestedScheduleId로 배정한다', () => {
    expect(
      resolveAssignableSchedulePayloadFromSession(
        session({ round: 1, date: '2026.10.01', requestedScheduleId: 9001 })
      )
    ).toEqual({ requestedScheduleId: 9001 })
  })

  it('scheduleUnresolved이거나 근거가 없으면 null', () => {
    expect(
      resolveAssignableSchedulePayloadFromSession(
        session({ round: 1, date: '2026.10.01', scheduleUnresolved: true })
      )
    ).toBeNull()
    expect(hasAssignableOrganizationInstructorSchedule([])).toBe(false)
    expect(
      hasAssignableOrganizationInstructorSchedule([
        session({ round: 1, date: '2026.10.01' }),
      ])
    ).toBe(false)
  })
})
