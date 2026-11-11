import { describe, expect, it } from 'vitest'
import type {
  ParticipatingSchoolRow,
  ParticipatingSchoolSession,
} from '@/features/program/general/model/participating-schools'
import type { ParticipatingVolunteerRow } from '@/features/program/general/model/participating-volunteers'
import {
  buildVolunteerWaitingInstitutionRows,
  hasStartedVolunteerAssignmentSession,
} from './participating-volunteer-institution-assignment'

const NOW = new Date('2026-11-11T03:00:00Z')

function session(
  round: number,
  startAt: string | undefined,
  resolvedScheduleId: number | null = 1000 + round
): ParticipatingSchoolSession {
  return {
    round,
    date: '2026.11.20',
    dayOfWeek: '금',
    duration: '60분',
    format: '-',
    classNum: '',
    timeRange: '10:00 ~ 11:00',
    resolvedScheduleId,
    ...(startAt ? { startAt } : {}),
  } as ParticipatingSchoolSession
}

function school(id: string, sessions: ParticipatingSchoolSession[]): ParticipatingSchoolRow {
  return {
    id,
    schoolName: `기관-${id}`,
    educationGrade: '3학년',
    region: '경기도',
    organizationApplicationId: id,
    sessions,
  } as unknown as ParticipatingSchoolRow
}

const volunteer = {
  id: '1695107',
  volunteerName: '봉사자',
  assignedInstitutionNames: [],
  sessions: [],
} as unknown as ParticipatingVolunteerRow

describe('hasStartedVolunteerAssignmentSession', () => {
  it('시작 시각이 지난 확정 회차가 있으면 true', () => {
    expect(
      hasStartedVolunteerAssignmentSession(
        school('a', [session(1, '2026-11-08T14:10:00Z'), session(2, '2026-11-20T01:00:00Z')]),
        NOW
      )
    ).toBe(true)
  })

  it('시작 시각과 같은 순간도 시작으로 본다', () => {
    expect(hasStartedVolunteerAssignmentSession(school('a', [session(1, NOW.toISOString())]), NOW)).toBe(
      true
    )
  })

  it('모든 회차가 미래이거나 시작 시각이 없으면 false', () => {
    expect(
      hasStartedVolunteerAssignmentSession(
        school('a', [session(1, '2026-11-20T01:00:00Z'), session(2, undefined)]),
        NOW
      )
    ).toBe(false)
  })

  it('미확정(일정 미생성) 회차는 배정 후보가 아니므로 판단에서 뺀다', () => {
    expect(
      hasStartedVolunteerAssignmentSession(
        school('a', [session(1, '2026-11-08T14:10:00Z', null)]),
        NOW
      )
    ).toBe(false)
  })
})

describe('buildVolunteerWaitingInstitutionRows — 시작된 회차가 있는 기관 비노출', () => {
  it('시작된 회차가 하나라도 있는 기관은 기관째 빼고, 미래 회차만 있는 기관은 남긴다', () => {
    const rows = buildVolunteerWaitingInstitutionRows(
      volunteer,
      [
        school('started', [session(1, '2026-11-08T14:10:00Z'), session(2, '2026-11-20T01:00:00Z')]),
        school('future', [session(1, '2026-11-20T01:00:00Z'), session(2, '2026-11-27T01:00:00Z')]),
      ],
      [],
      new Set(),
      undefined,
      NOW
    )
    expect(new Set(rows.map(row => row.schoolId))).toEqual(new Set(['future']))
    expect(rows).toHaveLength(2)
  })
})
