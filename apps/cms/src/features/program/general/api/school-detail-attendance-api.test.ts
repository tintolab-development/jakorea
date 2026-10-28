import { describe, expect, it, vi, beforeEach } from 'vitest'

const {
  fetchOrganizationStudentRosterRemoteMock,
  fetchAttendancesByScheduleIdsRemoteMock,
  bulkUpsertProgramAttendancesRemoteMock,
  fetchAllProgramProgressParticipantsMock,
} = vi.hoisted(() => ({
  fetchOrganizationStudentRosterRemoteMock: vi.fn(),
  fetchAttendancesByScheduleIdsRemoteMock: vi.fn(),
  bulkUpsertProgramAttendancesRemoteMock: vi.fn(),
  fetchAllProgramProgressParticipantsMock: vi.fn(),
}))

vi.mock('@/features/program/general/api/student-roster-api-client', () => ({
  fetchOrganizationStudentRosterRemote: fetchOrganizationStudentRosterRemoteMock,
}))

vi.mock('@/features/program/general/api/program-progress-api-client', () => ({
  fetchAttendancesByScheduleIdsRemote: fetchAttendancesByScheduleIdsRemoteMock,
  bulkUpsertProgramAttendancesRemote: bulkUpsertProgramAttendancesRemoteMock,
}))

vi.mock('@/features/program/general/api/admin-program-progress-service', () => ({
  fetchAllProgramProgressParticipants: fetchAllProgramProgressParticipantsMock,
}))

import {
  buildSchoolDetailAttendanceSessionGroups,
  collectChangedSchoolDetailAttendances,
  fetchSchoolDetailAttendanceBundle,
  mapApiStatusToSchoolSessionAttendance,
  mapSchoolSessionAttendanceToApi,
  saveSchoolDetailAttendanceSessionRemote,
} from './school-detail-attendance-api'
import type { Program } from '@/types/domain'
import type { SchoolDetailAttendanceStudentRow } from '@/features/program/general/model/school-detail-types'

function studentRow(
  overrides: Partial<SchoolDetailAttendanceStudentRow> & Pick<SchoolDetailAttendanceStudentRow, 'id' | 'status'>
): SchoolDetailAttendanceStudentRow {
  return {
    no: 1,
    name: '학생',
    gradeClass: '1반',
    attendanceRecorded: overrides.status !== 'unrecorded',
    participantId: 1,
    ...overrides,
  }
}

describe('school-detail-attendance-api', () => {
  beforeEach(() => {
    fetchOrganizationStudentRosterRemoteMock.mockReset()
    fetchAttendancesByScheduleIdsRemoteMock.mockReset()
    bulkUpsertProgramAttendancesRemoteMock.mockReset()
    fetchAllProgramProgressParticipantsMock.mockReset()
    fetchAllProgramProgressParticipantsMock.mockResolvedValue([])
  })

  it('maps API attendance status without coercing missing or EXCUSED values', () => {
    expect(mapApiStatusToSchoolSessionAttendance('LATE')).toBe('late')
    expect(mapApiStatusToSchoolSessionAttendance('EXCUSED')).toBe('excused')
    expect(mapApiStatusToSchoolSessionAttendance('PRESENT')).toBe('present')
    expect(mapApiStatusToSchoolSessionAttendance(null)).toBe('unrecorded')
    expect(mapApiStatusToSchoolSessionAttendance(undefined)).toBe('unrecorded')
    expect(mapApiStatusToSchoolSessionAttendance('')).toBe('unrecorded')
    expect(mapApiStatusToSchoolSessionAttendance('UNKNOWN')).toBe('unrecorded')
    expect(mapSchoolSessionAttendanceToApi('late')).toBe('LATE')
  })

  it('joins roster students with schedule attendances and keeps unrecorded rows', () => {
    const program = { id: 'p1' } as Program
    const groups = buildSchoolDetailAttendanceSessionGroups({
      schoolId: 'school-1',
      program,
      sessions: [
        {
          round: 1,
          date: '2026.01.09',
          dayOfWeek: '금',
          duration: '2시간',
          format: '오프라인',
          classNum: '1',
          timeRange: '9:20~11:10',
          resolvedScheduleId: 101,
        },
      ],
      rosterStudents: [
        {
          id: 'r1',
          no: 1,
          name: '홍길동',
          genderMask: '*',
          gradeClass: '1반',
          participantId: 55,
        },
        {
          id: 'r2',
          no: 2,
          name: '미기록학생',
          gradeClass: '1반',
          participantId: 56,
        },
      ],
      attendancesByScheduleId: {
        '101': [{ participantId: 55, status: 'LATE' }],
      },
    })

    expect(groups).toHaveLength(1)
    expect(groups[0]?.scheduleId).toBe(101)
    expect(groups[0]?.headerTitle).toBe('1회차 : 2026.01.09(금)')
    expect(groups[0]?.headerScheduleSummary).toBe('2시간 (오프라인)')
    expect(groups[0]?.headerPeriodRangeLabel).toBe('09:20 ~ 11:10')
    expect(groups[0]?.students).toHaveLength(2)
    expect(groups[0]?.students[0]?.genderMask).toBe('*')
    expect(groups[0]?.students[0]?.status).toBe('late')
    expect(groups[0]?.students[0]?.attendanceRecorded).toBe(true)
    expect(groups[0]?.students[0]?.participantId).toBe(55)
    expect(groups[0]?.students[1]?.status).toBe('unrecorded')
    expect(groups[0]?.students[1]?.attendanceRecorded).toBe(false)
  })

  it('hides a give-up student from later school attendance tables', () => {
    const groups = buildSchoolDetailAttendanceSessionGroups({
      schoolId: 'school-1',
      program: { id: 'p1' } as Program,
      sessions: [
        {
          round: 1,
          date: '2026.01.09',
          dayOfWeek: '금',
          duration: '2시간',
          format: '오프라인',
          classNum: '1',
          timeRange: '9:20~11:10',
          resolvedScheduleId: 101,
          startAt: '2026-01-09T09:20:00+09:00',
        },
        {
          round: 2,
          date: '2026.01.16',
          dayOfWeek: '금',
          duration: '2시간',
          format: '오프라인',
          classNum: '1',
          timeRange: '9:20~11:10',
          resolvedScheduleId: 102,
          startAt: '2026-01-16T09:20:00+09:00',
        },
      ],
      rosterStudents: [
        { id: 'r1', no: 1, name: '포기학생', gradeClass: '1반', participantId: 55 },
        { id: 'r2', no: 2, name: '진행학생', gradeClass: '1반', participantId: 56 },
      ],
      attendancesByScheduleId: {
        '101': [{ participantId: 55, status: 'PRESENT' }],
        '102': [{ participantId: 56, status: 'PRESENT' }],
      },
      giveUpParticipants: [
        {
          participantId: 55,
          participantStatus: 'GIVE_UP',
          giveUpAt: '2026-01-09T18:00:00+09:00',
        },
      ],
    })

    expect(groups[0]?.students.map(row => row.name)).toEqual(['포기학생', '진행학생'])
    expect(groups[1]?.students.map(row => row.name)).toEqual(['진행학생'])
  })

  it('keeps assigned schedules even when attendance records are empty', () => {
    const groups = buildSchoolDetailAttendanceSessionGroups({
      schoolId: 'school-1',
      program: { id: 'p1' } as Program,
      sessions: [
        {
          round: 1,
          date: '2026.01.09',
          dayOfWeek: '금',
          duration: '2시간',
          format: '대면',
          classNum: '1',
          timeRange: '9:20~10:10',
          resolvedScheduleId: 101,
        },
        {
          round: 2,
          date: '2026.01.10',
          dayOfWeek: '토',
          duration: '2시간',
          format: '대면',
          classNum: '1',
          timeRange: '9:20~10:10',
          resolvedScheduleId: 102,
        },
      ],
      rosterStudents: [
        { id: 'r1', no: 1, name: '학생', gradeClass: '1반', participantId: 55 },
      ],
      attendancesByScheduleId: {
        '101': [{ participantId: 55, status: 'PRESENT' }],
        '102': [],
      },
    })

    expect(groups.map(group => group.scheduleId)).toEqual([101, 102])
    expect(groups[1]?.students).toHaveLength(1)
    expect(groups[1]?.students[0]?.status).toBe('unrecorded')
  })

  it('does not invent a saveable scheduleId when mapping is missing', () => {
    const groups = buildSchoolDetailAttendanceSessionGroups({
      schoolId: 'school-1',
      program: { id: 'p1' } as Program,
      sessions: [
        {
          round: 1,
          date: '2026.01.09',
          dayOfWeek: '금',
          duration: '2시간',
          format: '대면',
          classNum: '1',
          timeRange: '9:20~10:10',
        },
      ],
      rosterStudents: [{ id: 'r1', no: 1, name: '학생', gradeClass: '1반', participantId: 55 }],
      attendancesByScheduleId: {},
    })

    expect(groups).toHaveLength(1)
    expect(groups[0]?.scheduleId).toBeNull()
    expect(groups[0]?.scheduleIdUnresolved).toBe(true)
    expect(groups[0]?.id).toBe('unresolved:school-1:round-1')
  })

  it('preserves EXCUSED as a recorded read-only status', () => {
    const groups = buildSchoolDetailAttendanceSessionGroups({
      schoolId: 'school-1',
      program: { id: 'p1' } as Program,
      sessions: [
        {
          round: 1,
          date: '2026.01.09',
          dayOfWeek: '금',
          duration: '2시간',
          format: '대면',
          classNum: '1',
          timeRange: '9:20~10:10',
          resolvedScheduleId: 101,
        },
      ],
      rosterStudents: [{ id: 'r1', no: 1, name: '학생', gradeClass: '1반', participantId: 55 }],
      attendancesByScheduleId: {
        '101': [{ participantId: 55, status: 'EXCUSED' }],
      },
    })

    expect(groups[0]?.students[0]?.status).toBe('excused')
    expect(groups[0]?.students[0]?.attendanceRecorded).toBe(true)
    expect(groups[0]?.students[0]?.recordedApiStatus).toBe('EXCUSED')
  })

  it('collects only explicitly changed editable attendances', () => {
    const baseline = [
      studentRow({ id: 'a', status: 'present', participantId: 1, attendanceRecorded: true }),
      studentRow({ id: 'b', status: 'excused', participantId: 2, attendanceRecorded: true }),
      studentRow({ id: 'c', status: 'unrecorded', participantId: 3, attendanceRecorded: false }),
      studentRow({ id: 'd', status: 'late', participantId: 4, attendanceRecorded: true }),
    ]
    const working = [
      studentRow({ id: 'a', status: 'absent', participantId: 1, attendanceRecorded: true }),
      studentRow({ id: 'b', status: 'excused', participantId: 2, attendanceRecorded: true }),
      studentRow({ id: 'c', status: 'unrecorded', participantId: 3, attendanceRecorded: false }),
      studentRow({ id: 'd', status: 'late', participantId: 4, attendanceRecorded: true }),
    ]

    expect(collectChangedSchoolDetailAttendances(working, baseline).map(row => row.id)).toEqual(['a'])
  })

  it('treats first explicit selection on an unrecorded student as a change', () => {
    const baseline = [
      studentRow({ id: 'c', status: 'unrecorded', participantId: 3, attendanceRecorded: false }),
    ]
    const working = [
      studentRow({ id: 'c', status: 'present', participantId: 3, attendanceRecorded: false }),
    ]
    expect(collectChangedSchoolDetailAttendances(working, baseline).map(row => row.id)).toEqual(['c'])
  })

  it('fetches roster and attendances for resolved schedules', async () => {
    fetchOrganizationStudentRosterRemoteMock.mockResolvedValue({
      rows: [{ rosterId: 1, studentName: 'A', participantId: 9 }],
    })
    fetchAttendancesByScheduleIdsRemoteMock.mockResolvedValue({
      '77': [{ participantId: 9, status: 'ABSENT' }],
    })

    const bundle = await fetchSchoolDetailAttendanceBundle({
      programId: 'p1',
      organizationApplicationId: '10',
      sessions: [
        {
          round: 1,
          date: '2026.01.09',
          dayOfWeek: '금',
          duration: '2시간',
          format: '대면',
          classNum: '1',
          timeRange: '9:20~10:10',
          resolvedScheduleId: 77,
        },
      ],
    })

    expect(fetchOrganizationStudentRosterRemoteMock).toHaveBeenCalledWith('10')
    expect(fetchAttendancesByScheduleIdsRemoteMock).toHaveBeenCalledWith('p1', [77], {
      organizationApplicationId: '10',
    })
    expect(bundle.rosterStudents[0]?.participantId).toBe(9)
    expect(bundle.attendancesByScheduleId['77']?.[0]?.status).toBe('ABSENT')
  })

  it('bulk 출석 조회 실패 시 오류를 전파한다', async () => {
    fetchOrganizationStudentRosterRemoteMock.mockResolvedValue({ rows: [] })
    fetchAttendancesByScheduleIdsRemoteMock.mockRejectedValue(new Error('network'))

    await expect(
      fetchSchoolDetailAttendanceBundle({
        programId: 'p1',
        organizationApplicationId: '10',
        sessions: [
          {
            round: 1,
            date: '2026.01.09',
            dayOfWeek: '금',
            duration: '2시간',
            format: '대면',
            classNum: '1',
            timeRange: '9:20~10:10',
            resolvedScheduleId: 77,
          },
        ],
      })
    ).rejects.toThrow('network')
  })

  it('saves only the provided changed rows via bulk-upsert', async () => {
    bulkUpsertProgramAttendancesRemoteMock.mockResolvedValue({})
    await saveSchoolDetailAttendanceSessionRemote({
      programId: 'p1',
      scheduleId: 77,
      organizationApplicationId: '10',
      students: [
        studentRow({
          id: 'r1',
          name: 'A',
          gradeClass: '1반',
          participantId: 9,
          status: 'absent',
        }),
        studentRow({
          id: 'r2',
          name: 'B',
          gradeClass: '1반',
          participantId: null,
          status: 'present',
        }),
        studentRow({
          id: 'r3',
          name: 'C',
          gradeClass: '1반',
          participantId: 11,
          status: 'excused',
        }),
      ],
    })

    expect(bulkUpsertProgramAttendancesRemoteMock).toHaveBeenCalledWith('p1', {
      scheduleId: 77,
      organizationApplicationId: 10,
      attendances: [{ participantId: 9, status: 'ABSENT' }],
    })
  })

  it('sends students with empty grade/class unchanged (GENERAL_ORGANIZATION 186408 regression)', async () => {
    bulkUpsertProgramAttendancesRemoteMock.mockResolvedValue({})
    await saveSchoolDetailAttendanceSessionRemote({
      programId: '186408',
      scheduleId: 187394,
      organizationApplicationId: '1691524',
      students: [
        studentRow({ id: 'r1', gradeClass: '', participantId: 1694983, status: 'late' }),
        studentRow({ id: 'r2', gradeClass: '', participantId: 1694984, status: 'late' }),
      ],
    })

    expect(bulkUpsertProgramAttendancesRemoteMock).toHaveBeenCalledWith('186408', {
      scheduleId: 187394,
      organizationApplicationId: 1691524,
      attendances: [
        { participantId: 1694983, status: 'LATE' },
        { participantId: 1694984, status: 'LATE' },
      ],
    })
  })
})
