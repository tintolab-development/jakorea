import { describe, expect, it } from 'vitest'
import type { ParticipatingSchoolRow } from '@/features/program/general/model/participating-schools'
import type { SlotResponse } from '@/shared/api/generated/dashboard/schemas/slotResponse'
import type { ProgramScheduleResponse } from '@/shared/api/generated/dashboard/schemas/programScheduleResponse'
import {
  dedupeParticipatingSessionsByScheduleId,
  resolveSchoolDetailAttendanceSessions,
} from './school-detail-attendance'
import { buildSchoolDetailAttendanceExcelRows } from './school-detail-attendance-export'
import type { SchoolDetailAttendanceSessionGroup } from '../model/school-detail-types'

function schoolRow(
  overrides: Partial<ParticipatingSchoolRow> = {}
): ParticipatingSchoolRow {
  return {
    id: 'school-1',
    no: 1,
    schoolName: '서울초등학교',
    region: '',
    educationGrade: '초5',
    classCount: 1,
    studentCount: 9,
    lectureRound: '2',
    textbookStatus: 'not_applicable',
    approvalStatus: 'approved',
    teacherName: '-',
    instructors: '',
    programId: '186234',
    organizationApplicationId: '1691001',
    sessions: [
      {
        round: 1,
        date: '2026.01.09',
        dayOfWeek: '금',
        duration: '2시간',
        format: '오프라인',
        classNum: '1',
        timeRange: '09:00 ~ 11:00',
        resolvedScheduleId: 101,
      },
      {
        round: 2,
        date: '2026.01.16',
        dayOfWeek: '금',
        duration: '2시간',
        format: '오프라인',
        classNum: '1',
        timeRange: '09:00 ~ 11:00',
        resolvedScheduleId: 999,
      },
    ],
    ...overrides,
  }
}

describe('resolveSchoolDetailAttendanceSessions', () => {
  it('uses OSA assigned schedules for general organization programs, not row.sessions', () => {
    const slots: SlotResponse[] = [
      {
        assignmentId: 1,
        programId: 186234,
        organizationApplicationId: 1691001,
        scheduleId: 101,
        assignmentStatus: 'CONFIRMED',
        active: true,
      },
    ]
    const schedules: ProgramScheduleResponse[] = [
      {
        id: 101,
        sessionNo: 1,
        scheduleName: '오리엔테이션',
        startAt: '2026-01-09T09:00:00+09:00',
        endAt: '2026-01-09T11:00:00+09:00',
      },
    ]

    const sessions = resolveSchoolDetailAttendanceSessions({
      row: schoolRow(),
      isGeneralOrganization: true,
      assignmentSlots: slots,
      programSchedules: schedules,
      assignmentScopeReady: true,
    })

    expect(sessions.map(session => session.resolvedScheduleId)).toEqual([101])
  })

  it('does not fall back to row.sessions when the institution has no OSA assignments', () => {
    const sessions = resolveSchoolDetailAttendanceSessions({
      row: schoolRow(),
      isGeneralOrganization: true,
      assignmentSlots: [],
      programSchedules: [],
      assignmentScopeReady: true,
    })
    expect(sessions).toEqual([])
  })

  it('ignores another institution assignment even if it is in the same program', () => {
    const slots: SlotResponse[] = [
      {
        assignmentId: 8,
        programId: 186234,
        organizationApplicationId: 1691999,
        scheduleId: 202,
        assignmentStatus: 'CONFIRMED',
        active: true,
      },
    ]
    const sessions = resolveSchoolDetailAttendanceSessions({
      row: schoolRow(),
      isGeneralOrganization: true,
      assignmentSlots: slots,
      programSchedules: [{ id: 202, sessionNo: 1 }],
      assignmentScopeReady: true,
    })
    expect(sessions).toEqual([])
  })

  it('uses confirmed participant sessions for non-general programs', () => {
    const sessions = resolveSchoolDetailAttendanceSessions({
      row: schoolRow(),
      isGeneralOrganization: false,
      assignmentScopeReady: false,
    })
    expect(sessions.map(session => session.resolvedScheduleId)).toEqual([101, 999])
  })
})

describe('dedupeParticipatingSessionsByScheduleId', () => {
  it('keeps one attendance table per scheduleId', () => {
    const deduped = dedupeParticipatingSessionsByScheduleId([
      {
        round: 1,
        date: '2026.01.09',
        dayOfWeek: '금',
        duration: '-',
        format: '-',
        classNum: '1',
        timeRange: '-',
        resolvedScheduleId: 101,
      },
      {
        round: 1,
        date: '2026.01.09',
        dayOfWeek: '금',
        duration: '-',
        format: '-',
        classNum: '2',
        timeRange: '-',
        resolvedScheduleId: 101,
      },
    ])
    expect(deduped).toHaveLength(1)
  })
})

describe('buildSchoolDetailAttendanceExcelRows', () => {
  it('exports every assigned session and keeps unrecorded/excused labels', () => {
    const groups: SchoolDetailAttendanceSessionGroup[] = [
      {
        id: '101',
        round: 1,
        filterValue: '101',
        scheduleId: 101,
        scheduleIdUnresolved: false,
        attendanceRecordingOpen: true,
        sessionLeadLabel: '1회차',
        headerTitle: '1회차 : 2026.01.09(금)',
        headerScheduleSummary: '2시간 (오프라인)',
        headerPeriodRangeLabel: '09:00 ~ 11:00',
        headerPrefix: '1회차 : 2026.01.09(금) 2시간 (오프라인) | 09:00 ~ 11:00',
        students: [
          {
            id: 'a',
            no: 1,
            name: '기록학생',
            gradeClass: '1반',
            status: 'present',
            attendanceRecorded: true,
            participantId: 1,
          },
        ],
      },
      {
        id: '102',
        round: 2,
        filterValue: '102',
        scheduleId: 102,
        scheduleIdUnresolved: false,
        attendanceRecordingOpen: true,
        sessionLeadLabel: '2회차',
        headerTitle: '2회차 : 2026.01.16(금)',
        headerScheduleSummary: '2시간 (오프라인)',
        headerPeriodRangeLabel: '09:00 ~ 11:00',
        headerPrefix: '2회차 : 2026.01.16(금) 2시간 (오프라인) | 09:00 ~ 11:00',
        students: [
          {
            id: 'b',
            no: 1,
            name: '미기록학생',
            gradeClass: '1반',
            status: 'unrecorded',
            attendanceRecorded: false,
            participantId: 2,
          },
          {
            id: 'c',
            no: 2,
            name: '사유불참학생',
            gradeClass: '1반',
            status: 'excused',
            attendanceRecorded: true,
            recordedApiStatus: 'EXCUSED',
            participantId: 3,
          },
        ],
      },
    ]

    const rows = buildSchoolDetailAttendanceExcelRows(groups)
    expect(rows).toHaveLength(3)
    expect(rows.map(row => row.sessionLabel)).toEqual([
      groups[0]?.headerPrefix,
      groups[1]?.headerPrefix,
      groups[1]?.headerPrefix,
    ])
    expect(rows.map(row => row.statusLabel)).toEqual(['출석', '미기록', '사유 불참'])
  })
})
