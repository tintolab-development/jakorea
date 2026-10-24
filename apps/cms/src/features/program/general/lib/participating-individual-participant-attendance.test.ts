import { describe, expect, it } from 'vitest'
import type { ParticipatingIndividualParticipantRow } from '@/features/program/general/model/participating-individual-participants'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import type { Program } from '@/types/domain'
import { buildParticipatingSchoolSessionKey } from '@/features/program/general/lib/participating-institution-activity-withdraw'
import type { ParticipatingIndividualProgressAttendanceSessionGroup } from '@/features/program/general/lib/participating-individual-progress-attendance-types'
import { buildParticipatingIndividualParticipantAttendanceRowsFromAssigned } from './participating-individual-participant-attendance'

const program = { id: '186099' } as Program

function assignedSession(
  scheduleId: number,
  overrides: Partial<ParticipatingSchoolSession> = {}
): ParticipatingSchoolSession {
  return {
    round: 1,
    date: '2026.04.03',
    dayOfWeek: '금',
    duration: '60분',
    format: '-',
    classNum: '1교시',
    timeRange: '09:00 ~ 12:00',
    resolvedScheduleId: scheduleId,
    deliveryScheduleStatus: 'COMPLETED',
    educationScheduleLabel: '오리엔테이션',
    ...overrides,
  }
}

function participant(
  overrides: Partial<ParticipatingIndividualParticipantRow> = {}
): ParticipatingIndividualParticipantRow {
  return {
    id: 'p-1',
    lectureAttendanceSessions: [],
    satisfactionSurveyCompleted: false,
    participationAppliedAt: '2026-03-01',
    ...overrides,
  } as ParticipatingIndividualParticipantRow
}

function attendanceSession(
  scheduleId: string,
  overrides: Partial<ParticipatingIndividualProgressAttendanceSessionGroup> = {}
): ParticipatingIndividualProgressAttendanceSessionGroup {
  return {
    id: scheduleId,
    round: 1,
    filterValue: scheduleId,
    filterLabel: `${scheduleId}회차`,
    headerTitle: '1회차 출석',
    headerDateLabel: '2026.04.03',
    headerScheduleSummary: '1회차',
    headerPeriodRangeLabel: '-',
    headerPrefix: '1회차',
    scheduleEducationProgress: 'completed',
    attendanceRecordingOpen: true,
    participants: [
      {
        id: 'row-p-1',
        participantId: 'p-1',
        name: '김범수',
        genderBirthLabel: '-',
        affiliationGradeLabel: '-',
        affiliation: '-',
        educationGrade: '-',
        attendanceRecorded: true,
        attendanceStatus: 'present',
      },
    ],
    ...overrides,
  }
}

describe('buildParticipatingIndividualParticipantAttendanceRowsFromAssigned', () => {
  it('keeps only assigned schedule ids in assigned order', () => {
    const assigned = [
      assignedSession(10, { educationScheduleLabel: '오리엔테이션' }),
      assignedSession(20, {
        date: '2026.04.17',
        educationScheduleLabel: '1차 교육',
      }),
    ]
    const rows = buildParticipatingIndividualParticipantAttendanceRowsFromAssigned({
      assignedSessions: assigned,
      attendanceSessions: [
        attendanceSession('99', {
          participants: [
            {
              id: 'other',
              participantId: 'p-other',
              name: '다른사람',
              genderBirthLabel: '-',
              affiliationGradeLabel: '-',
              affiliation: '-',
              educationGrade: '-',
              attendanceRecorded: true,
              attendanceStatus: 'absent',
            },
          ],
        }),
        attendanceSession('10'),
      ],
      participant: participant(),
      program,
    })

    expect(rows.map(row => row.scheduleId)).toEqual(['10', '20'])
    expect(rows[0]?.attendanceStatus).toBe('present')
    expect(rows[1]?.attendanceStatus).toBe('pending')
    expect(rows.some(row => row.scheduleId === '99')).toBe(false)
  })

  it('keeps an assigned session without attendance records as pending', () => {
    const rows = buildParticipatingIndividualParticipantAttendanceRowsFromAssigned({
      assignedSessions: [
        assignedSession(30, {
          deliveryScheduleStatus: 'SCHEDULED',
          educationScheduleLabel: '4차 교육',
        }),
      ],
      attendanceSessions: [],
      participant: participant(),
      program,
    })

    expect(rows).toHaveLength(1)
    expect(rows[0]?.scheduleId).toBe('30')
    expect(rows[0]?.attendanceStatus).toBe('pending')
    expect(rows[0]?.educationProgress).toBe('scheduled')
  })

  it('marks the activity-withdraw stop session as withdrawn', () => {
    const sessions = [
      assignedSession(10),
      assignedSession(20, {
        date: '2026.06.05',
        deliveryScheduleStatus: 'SCHEDULED',
        educationScheduleLabel: '4차 교육',
      }),
    ]
    const stopKey = buildParticipatingSchoolSessionKey(sessions[1]!, 1)
    const rows = buildParticipatingIndividualParticipantAttendanceRowsFromAssigned({
      assignedSessions: sessions,
      attendanceSessions: [attendanceSession('10')],
      participant: participant({
        activityWithdrawn: true,
        activityWithdrawStopSessionKey: stopKey,
      }),
      program,
    })

    expect(rows[0]?.scheduleId).toBe('10')
    expect(rows[0]?.attendanceStatus).toBe('present')
    expect(rows[1]?.scheduleId).toBe('20')
    expect(rows[1]?.attendanceStatus).toBe('withdrawn')
  })

  it('returns empty when nothing is assigned', () => {
    expect(
      buildParticipatingIndividualParticipantAttendanceRowsFromAssigned({
        assignedSessions: [],
        attendanceSessions: [attendanceSession('10')],
        participant: participant(),
        program,
      })
    ).toEqual([])
  })

  it('skips assigned sessions without a resolved schedule id', () => {
    const rows = buildParticipatingIndividualParticipantAttendanceRowsFromAssigned({
      assignedSessions: [
        assignedSession(10),
        assignedSession(0, { resolvedScheduleId: null }),
      ],
      attendanceSessions: [attendanceSession('10')],
      participant: participant(),
      program,
    })

    expect(rows.map(row => row.scheduleId)).toEqual(['10'])
  })
})
