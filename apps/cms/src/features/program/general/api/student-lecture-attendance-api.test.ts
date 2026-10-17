import { describe, expect, it, vi, beforeEach } from 'vitest'

const {
  fetchProgramSchedulesViaDashboardRemoteMock,
  fetchAttendancesByScheduleIdsRemoteMock,
  bulkUpsertProgramAttendancesRemoteMock,
} = vi.hoisted(() => ({
  fetchProgramSchedulesViaDashboardRemoteMock: vi.fn(),
  fetchAttendancesByScheduleIdsRemoteMock: vi.fn(),
  bulkUpsertProgramAttendancesRemoteMock: vi.fn(),
}))

vi.mock('@/features/program/general/api/program-progress-api-client', () => ({
  fetchProgramSchedulesViaDashboardRemote: fetchProgramSchedulesViaDashboardRemoteMock,
  fetchAttendancesByScheduleIdsRemote: fetchAttendancesByScheduleIdsRemoteMock,
  bulkUpsertProgramAttendancesRemote: bulkUpsertProgramAttendancesRemoteMock,
}))

import {
  fetchStudentLectureAttendanceByParticipantRemote,
  saveStudentLectureAttendanceByParticipantRemote,
} from './student-lecture-attendance-api'

describe('student-lecture-attendance-api', () => {
  beforeEach(() => {
    fetchProgramSchedulesViaDashboardRemoteMock.mockReset()
    fetchAttendancesByScheduleIdsRemoteMock.mockReset()
    bulkUpsertProgramAttendancesRemoteMock.mockReset()
  })

  it('builds sessions from schedules + participant attendance rows', async () => {
    fetchProgramSchedulesViaDashboardRemoteMock.mockResolvedValue([
      { scheduleId: 10, sessionNo: 1 },
      { scheduleId: 11, sessionNo: 2 },
    ])
    fetchAttendancesByScheduleIdsRemoteMock.mockResolvedValue({
      '10': [{ participantId: 77, status: 'PRESENT' }],
      '11': [{ participantId: 77, status: 'LATE' }],
    })

    const detail = await fetchStudentLectureAttendanceByParticipantRemote({
      programId: 'p1',
      participantId: 77,
      studentName: '김학생',
    })

    expect(detail.studentName).toBe('김학생')
    expect(detail.sessions).toEqual([
      { roundNumber: 1, scheduleId: 10, status: 'attended' },
      { roundNumber: 2, scheduleId: 11, status: 'late' },
    ])
    expect(detail.attendanceRatePercent).toBe(100)
    expect(fetchAttendancesByScheduleIdsRemoteMock).toHaveBeenCalledTimes(1)
    expect(fetchAttendancesByScheduleIdsRemoteMock).toHaveBeenCalledWith('p1', [10, 11])
  })

  it('bulk 출석 조회 실패 시 오류를 전파한다', async () => {
    fetchProgramSchedulesViaDashboardRemoteMock.mockResolvedValue([
      { scheduleId: 10, sessionNo: 1 },
    ])
    fetchAttendancesByScheduleIdsRemoteMock.mockRejectedValue(new Error('500'))

    await expect(
      fetchStudentLectureAttendanceByParticipantRemote({
        programId: 'p1',
        participantId: 77,
        studentName: '김학생',
      })
    ).rejects.toThrow('500')
  })

  it('does not create not-held sessions for empty/unassigned schedules', async () => {
    fetchProgramSchedulesViaDashboardRemoteMock.mockResolvedValue([
      { scheduleId: 10, sessionNo: 1 },
      { scheduleId: 11, sessionNo: 2 },
    ])
    fetchAttendancesByScheduleIdsRemoteMock.mockResolvedValue({
      '10': [{ participantId: 77, status: 'PRESENT' }],
      '11': [],
    })

    const detail = await fetchStudentLectureAttendanceByParticipantRemote({
      programId: 'p1',
      participantId: 77,
      studentName: '김학생',
    })

    expect(detail.sessions).toEqual([
      { roundNumber: 1, scheduleId: 10, status: 'attended' },
    ])
    expect(detail.attendanceRatePercent).toBe(100)
  })

  it('upserts only editable sessions with scheduleId', async () => {
    bulkUpsertProgramAttendancesRemoteMock.mockResolvedValue({})
    await saveStudentLectureAttendanceByParticipantRemote({
      programId: 'p1',
      participantId: 77,
      sessions: [
        { roundNumber: 1, scheduleId: 10, status: 'attended' },
        { roundNumber: 2, scheduleId: 11, status: 'not_held' },
        { roundNumber: 3, status: 'absent' },
      ],
    })
    expect(bulkUpsertProgramAttendancesRemoteMock).toHaveBeenCalledTimes(1)
    expect(bulkUpsertProgramAttendancesRemoteMock).toHaveBeenCalledWith('p1', {
      scheduleId: 10,
      attendances: [{ participantId: 77, status: 'PRESENT' }],
    })
  })
})
