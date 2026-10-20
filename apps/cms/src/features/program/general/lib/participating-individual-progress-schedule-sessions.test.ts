import { describe, expect, it } from 'vitest'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import type { ProgramEducationSlotResponse } from '@/shared/api/generated/dashboard/schemas/programEducationSlotResponse'
import { resolveParticipatingIndividualProgressScheduleSessions } from './participating-individual-progress-schedule-sessions'

function session(scheduleId: number, overrides: Partial<ParticipatingSchoolSession> = {}) {
  return {
    round: 1,
    date: '2026. 10. 30',
    dayOfWeek: '금',
    duration: '60분',
    format: '-',
    classNum: '1교시',
    timeRange: '13:03 ~ 14:03',
    resolvedScheduleId: scheduleId,
    deliveryScheduleStatus: 'IN_PROGRESS',
    ...overrides,
  }
}

function slot(scheduleId: number): ProgramEducationSlotResponse {
  return {
    scheduleId,
    sessionNo: 1,
    startAt: '2026-10-30T04:03:00Z',
    endAt: '2026-10-30T05:03:00Z',
    allDay: false,
    educationSlotKey: `line:${scheduleId}`,
    scheduleRole: 'EDUCATION',
    scheduleStatus: 'ACTIVE',
    scheduleOrigin: 'PROGRAM_DEFINED',
  }
}

describe('resolveParticipatingIndividualProgressScheduleSessions', () => {
  it('keeps only education-scope assigned schedule ids in API order', () => {
    const result = resolveParticipatingIndividualProgressScheduleSessions({
      participantSessions: [
        session(187100, { deliveryScheduleStatus: 'COMPLETED' }),
        session(187163, { deliveryScheduleStatus: 'IN_PROGRESS' }),
        session(187200, { deliveryScheduleStatus: 'WAITING' }),
      ],
      assignedScheduleIds: [187163],
    })
    expect(result).toHaveLength(1)
    expect(result[0]?.resolvedScheduleId).toBe(187163)
    expect(result[0]?.deliveryScheduleStatus).toBe('IN_PROGRESS')
  })

  it('falls back to education-slots when participant sessions omit an assigned id', () => {
    const result = resolveParticipatingIndividualProgressScheduleSessions({
      participantSessions: [session(187100)],
      assignedScheduleIds: [187163],
      educationSlots: [slot(187163)],
    })
    expect(result).toHaveLength(1)
    expect(result[0]?.resolvedScheduleId).toBe(187163)
    expect(result[0]?.timeRange).toContain('~')
  })

  it('returns empty when no assigned ids', () => {
    expect(
      resolveParticipatingIndividualProgressScheduleSessions({
        participantSessions: [session(1)],
        assignedScheduleIds: [],
      })
    ).toEqual([])
  })
})
