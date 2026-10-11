import { describe, expect, it } from 'vitest'
import { buildEmployeeVolunteerSessionRowScheduleMap } from './employee-volunteer-counts-remote'
import type { EmployeeVolunteerSessionRow } from './employee-volunteer-session-rows'

describe('buildEmployeeVolunteerSessionRowScheduleMap', () => {
  const sessionRows: EmployeeVolunteerSessionRow[] = [
    {
      id: 'pre_education',
      label: '사전교육',
      round: null,
      isPreEducation: true,
      countsTowardParticipants: true,
    },
    {
      id: 'round_1',
      label: '1회차 교육',
      round: 1,
      isPreEducation: false,
      countsTowardParticipants: false,
    },
    {
      id: 'round_2',
      label: '2회차 교육',
      round: 2,
      isPreEducation: false,
      countsTowardParticipants: false,
    },
  ]

  it('sessionNo로 회차 scheduleId를 매칭한다', () => {
    const map = buildEmployeeVolunteerSessionRowScheduleMap(sessionRows, [
      { scheduleId: 10, sessionNo: 0, scheduleName: '사전교육' },
      { scheduleId: 20, sessionNo: 1, scheduleName: '1회차' },
      { scheduleId: 30, sessionNo: 2, scheduleName: '2회차' },
    ])

    expect(map.get('pre_education')).toBe(10)
    expect(map.get('round_1')).toBe(20)
    expect(map.get('round_2')).toBe(30)
  })
})
