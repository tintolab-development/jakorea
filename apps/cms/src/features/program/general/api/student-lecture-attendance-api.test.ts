import { describe, expect, it, vi, beforeEach } from 'vitest'

const {
  fetchProgramSchedulesViaDashboardRemoteMock,
  fetchScheduleAttendancesRemoteMock,
  bulkUpsertProgramAttendancesRemoteMock,
} = vi.hoisted(() => ({
  fetchProgramSchedulesViaDashboardRemoteMock: vi.fn(),
  fetchScheduleAttendancesRemoteMock: vi.fn(),
  bulkUpsertProgramAttendancesRemoteMock: vi.fn(),
}))

vi.mock('@/features/program/general/api/program-progress-api-client', () => ({
  fetchProgramSchedulesViaDashboardRemote: fetchProgramSchedulesViaDashboardRemoteMock,
  fetchScheduleAttendancesRemote: fetchScheduleAttendancesRemoteMock,
  bulkUpsertProgramAttendancesRemote: bulkUpsertProgramAttendancesRemoteMock,
}))

import {
  fetchStudentLectureAttendanceByParticipantRemote,
  saveStudentLectureAttendanceByParticipantRemote,
} from './student-lecture-attendance-api'

describe('student-lecture-attendance-api', () => {
  beforeEach(() => {
    fetchProgramSchedulesViaDashboardRemoteMock.mockReset()
    fetchScheduleAttendancesRemoteMock.mockReset()
    bulkUpsertProgramAttendancesRemoteMock.mockReset()
  })

  it('builds sessions from schedules + participant attendance rows', async () => {
    fetchProgramSchedulesViaDashboardRemoteMock.mockResolvedValue([
      { scheduleId: 10, sessionNo: 1 },
      { scheduleId: 11, sessionNo: 2 },
    ])
    fetchScheduleAttendancesRemoteMock
      .mockResolvedValueOnce([{ participantId: 77, status: 'PRESENT' }])
      .mockResolvedValueOnce([{ participantId: 77, status: 'LATE' }])

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
