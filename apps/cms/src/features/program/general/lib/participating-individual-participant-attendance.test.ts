import { describe, expect, it } from 'vitest'
import type { ParticipatingIndividualParticipantRow } from '@/features/program/general/model/participating-individual-participants'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import type { Program } from '@/types/domain'
import { buildParticipatingSchoolSessionKey } from '@/features/program/general/lib/participating-institution-activity-withdraw'
import type { ParticipatingIndividualProgressAttendanceSessionGroup } from '@/features/program/general/lib/participating-individual-progress-attendance-types'
import {
  buildParticipatingIndividualParticipantAttendanceRowsFromAssigned,
  buildParticipatingIndividualParticipantAttendanceSummary,
  mergeParticipatingIndividualAbsenceReasons,
} from './participating-individual-participant-attendance'
import type { ParticipatingIndividualParticipantAttendanceRow } from './participating-individual-participant-attendance-types'

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
  } as unknown as ParticipatingIndividualParticipantRow
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
    expect(rows[1]?.attendanceStatus).toBe('present')
    expect(rows.some(row => row.scheduleId === '99')).toBe(false)
  })

  it('keeps an assigned session without attendance records as present', () => {
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
    expect(rows[0]?.attendanceStatus).toBe('present')
    expect(rows[0]?.attendanceRecorded).toBe(false)
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

  it('uses persisted attendance even before the session is open for display', () => {
    const rows = buildParticipatingIndividualParticipantAttendanceRowsFromAssigned({
      assignedSessions: [assignedSession(10)],
      attendanceSessions: [
        attendanceSession('10', {
          attendanceRecordingOpen: false,
          participants: [
            {
              id: 'row-p-1',
              participantId: 'p-1',
              name: '김범수',
              genderBirthLabel: '-',
              affiliationGradeLabel: '-',
              affiliation: '-',
              educationGrade: '-',
              attendanceRecorded: false,
              persistedAttendanceStatus: 'excused_absence',
              remark: '병원 진료',
            },
          ],
        }),
      ],
      participant: participant(),
      program,
    })

    expect(rows[0]?.attendanceStatus).toBe('excused_absence')
    expect(rows[0]?.attendanceRecorded).toBe(true)
    expect(rows[0]?.remark).toBe('병원 진료')
  })

  it('counts PRESENT from attendancesByScheduleId even when session groups are missing', () => {
    const rows = buildParticipatingIndividualParticipantAttendanceRowsFromAssigned({
      assignedSessions: [
        assignedSession(187612, { educationScheduleLabel: '개인일정111' }),
        assignedSession(187613, {
          date: '2026.10.31',
          educationScheduleLabel: '팀일정111',
        }),
        assignedSession(187614, {
          date: '2026.10.31',
          educationScheduleLabel: '사전교육',
        }),
      ],
      attendanceSessions: [],
      attendancesByScheduleId: {
        '187612': [{ participantId: 1695039, status: 'PRESENT' }],
        '187613': [{ participantId: 1695039, status: 'PRESENT' }],
        '187614': [{ participantId: 1695039, status: 'PRESENT' }],
      },
      participant: participant({ id: '1695039' }),
      program,
    })

    expect(rows).toHaveLength(3)
    expect(rows.every(row => row.attendanceRecorded)).toBe(true)
    expect(rows.every(row => row.attendanceStatus === 'present')).toBe(true)
    expect(
      buildParticipatingIndividualParticipantAttendanceSummary(
        rows,
        participant({ id: '1695039' }),
        { id: '186507', lifecycleStatus: 'in_progress' } as Program
      ).attendanceRateCountLabel
    ).toBe('3 / 3건')
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

function summaryRow(
  assignedIndex: number,
  overrides: Partial<ParticipatingIndividualParticipantAttendanceRow> = {}
): ParticipatingIndividualParticipantAttendanceRow {
  return {
    id: String(assignedIndex),
    scheduleId: String(assignedIndex),
    assignedIndex,
    scheduleLabel: `${assignedIndex}회차`,
    attendanceStatus: 'present',
    attendanceRecorded: true,
    educationProgress: 'completed',
    ...overrides,
  }
}

describe('buildParticipatingIndividualParticipantAttendanceSummary', () => {
  it('counts late as attended and keeps absences out of the numerator', () => {
    const rows = [
      ...Array.from({ length: 5 }, (_, index) => summaryRow(index)),
      summaryRow(5, { attendanceStatus: 'late' }),
      summaryRow(6, { attendanceStatus: 'absent' }),
    ]
    const summary = buildParticipatingIndividualParticipantAttendanceSummary(
      rows,
      participant(),
      { id: '186099', lifecycleStatus: 'completed' } as Program
    )

    expect(summary.attendanceRateCountLabel).toBe('6 / 7건')
    expect(summary.lateCountLabel).toBe('1회')
    expect(summary.completionStatusLabel).toBe('수료 불가')
  })

  it('marks completion after program end when there is no absence and survey is done', () => {
    const rows = [
      ...Array.from({ length: 6 }, (_, index) => summaryRow(index)),
      summaryRow(6, { attendanceStatus: 'late' }),
    ]
    const summary = buildParticipatingIndividualParticipantAttendanceSummary(
      rows,
      participant({ satisfactionSurveyCompleted: true }),
      {
        id: '186099',
        lifecycleStatus: 'completed',
        generalSurveyMenuKeys: ['satisfaction'],
      } as Program
    )

    expect(summary.attendanceRateCountLabel).toBe('7 / 7건')
    expect(summary.completionStatusLabel).toBe('수료 완료')
  })

  it('shows 0 / N before education starts and ignores display-only present', () => {
    const rows = Array.from({ length: 7 }, (_, index) =>
      summaryRow(index, {
        attendanceRecorded: false,
        educationProgress: 'scheduled',
      })
    )
    const summary = buildParticipatingIndividualParticipantAttendanceSummary(
      rows,
      participant(),
      { id: '186099', lifecycleStatus: 'scheduled' } as Program
    )

    expect(summary.attendanceRateCountLabel).toBe('0 / 7건')
    expect(summary.completionStatusLabel).toBe('교육 진행 전')
  })

  it('uses the same attendance-rate formula for withdrawn participants', () => {
    const rows = [
      ...Array.from({ length: 4 }, (_, index) => summaryRow(index)),
      summaryRow(4, { attendanceStatus: 'late' }),
      summaryRow(5, { attendanceStatus: 'absent' }),
      summaryRow(6, {
        attendanceStatus: 'withdrawn',
        attendanceRecorded: false,
        educationProgress: 'scheduled',
      }),
    ]
    const summary = buildParticipatingIndividualParticipantAttendanceSummary(
      rows,
      participant({ activityWithdrawn: true }),
      { id: '186099', lifecycleStatus: 'in_progress' } as Program
    )

    expect(summary.attendanceRateCountLabel).toBe('5 / 7건')
    expect(summary.completionStatusLabel).toBe('수료 불가(활동 포기)')
  })
})

describe('mergeParticipatingIndividualAbsenceReasons', () => {
  it('keeps row-derived excused absences when remote list is empty', () => {
    const fromRows = [
      {
        id: 'abs-10',
        scheduleRowId: '10',
        dateLabel: '4월 3일',
        reason: '병원 진료',
        fileName: null,
      },
    ]
    expect(mergeParticipatingIndividualAbsenceReasons([], fromRows)).toEqual(fromRows)
  })

  it('prefers remote files and still adds missing local rows', () => {
    const remote = [
      {
        id: 'remote-10',
        scheduleRowId: '10',
        dateLabel: '4월 3일',
        reason: '병원 진료',
        fileName: '증빙.pdf',
      },
    ]
    const fromRows = [
      {
        id: 'abs-10',
        scheduleRowId: '10',
        dateLabel: '4월 3일',
        reason: '병원 진료',
        fileName: null,
      },
      {
        id: 'abs-20',
        scheduleRowId: '20',
        dateLabel: '4월 17일',
        reason: '가족 행사',
        fileName: null,
      },
    ]
    const merged = mergeParticipatingIndividualAbsenceReasons(remote, fromRows)
    expect(merged).toEqual([remote[0], fromRows[1]])
  })
})
