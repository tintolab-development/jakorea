import { describe, expect, it, vi, beforeEach } from 'vitest'

const {
  fetchOrganizationStudentRosterRemoteMock,
  fetchScheduleAttendancesRemoteMock,
  bulkUpsertProgramAttendancesRemoteMock,
} = vi.hoisted(() => ({
  fetchOrganizationStudentRosterRemoteMock: vi.fn(),
  fetchScheduleAttendancesRemoteMock: vi.fn(),
  bulkUpsertProgramAttendancesRemoteMock: vi.fn(),
}))

vi.mock('@/features/program/general/api/student-roster-api-client', () => ({
  fetchOrganizationStudentRosterRemote: fetchOrganizationStudentRosterRemoteMock,
}))

vi.mock('@/features/program/general/api/program-progress-api-client', () => ({
  fetchScheduleAttendancesRemote: fetchScheduleAttendancesRemoteMock,
  bulkUpsertProgramAttendancesRemote: bulkUpsertProgramAttendancesRemoteMock,
}))

import {
  buildSchoolDetailAttendanceSessionGroups,
  fetchSchoolDetailAttendanceBundle,
  mapApiStatusToSchoolSessionAttendance,
  mapSchoolSessionAttendanceToApi,
  saveSchoolDetailAttendanceSessionRemote,
} from './school-detail-attendance-api'
import type { Program } from '@/types/domain'

describe('school-detail-attendance-api', () => {
  beforeEach(() => {
    fetchOrganizationStudentRosterRemoteMock.mockReset()
    fetchScheduleAttendancesRemoteMock.mockReset()
    bulkUpsertProgramAttendancesRemoteMock.mockReset()
  })

  it('maps API attendance status to UI keys', () => {
    expect(mapApiStatusToSchoolSessionAttendance('LATE')).toBe('late')
    expect(mapApiStatusToSchoolSessionAttendance('EXCUSED')).toBe('absent')
    expect(mapApiStatusToSchoolSessionAttendance('PRESENT')).toBe('present')
    expect(mapSchoolSessionAttendanceToApi('late')).toBe('LATE')
  })

  it('joins roster students with schedule attendances', () => {
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
          gradeClass: '1반',
          participantId: 55,
        },
      ],
      attendancesByScheduleId: {
        '101': [{ participantId: 55, status: 'LATE' }],
      },
    })

    expect(groups).toHaveLength(1)
    expect(groups[0]?.scheduleId).toBe(101)
    expect(groups[0]?.students[0]?.status).toBe('late')
    expect(groups[0]?.students[0]?.participantId).toBe(55)
  })

  it('fetches roster and attendances for resolved schedules', async () => {
    fetchOrganizationStudentRosterRemoteMock.mockResolvedValue({
      rows: [{ rosterId: 1, studentName: 'A', participantId: 9 }],
    })
    fetchScheduleAttendancesRemoteMock.mockResolvedValue([
      { participantId: 9, status: 'ABSENT' },
    ])

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
    expect(fetchScheduleAttendancesRemoteMock).toHaveBeenCalledWith('p1', '77')
    expect(bundle.rosterStudents[0]?.participantId).toBe(9)
    expect(bundle.attendancesByScheduleId['77']?.[0]?.status).toBe('ABSENT')
  })

  it('saves via bulk-upsert with mapped statuses', async () => {
    bulkUpsertProgramAttendancesRemoteMock.mockResolvedValue({})
    await saveSchoolDetailAttendanceSessionRemote({
      programId: 'p1',
      scheduleId: 77,
      students: [
        {
          id: 'r1',
          no: 1,
          name: 'A',
          gradeClass: '1반',
          participantId: 9,
          status: 'absent',
        },
        {
          id: 'r2',
          no: 2,
          name: 'B',
          gradeClass: '1반',
          participantId: null,
          status: 'present',
        },
      ],
    })

    expect(bulkUpsertProgramAttendancesRemoteMock).toHaveBeenCalledWith('p1', {
      scheduleId: 77,
      attendances: [{ participantId: 9, status: 'ABSENT' }],
    })
  })
})
