import { describe, expect, it, vi, beforeEach } from 'vitest'

const {
  fetchProgramSchedulesViaDashboardRemoteMock,
  fetchAttendancesByScheduleIdsRemoteMock,
  bulkUpsertProgramAttendancesRemoteMock,
  fetchOrganizationScheduleAssignmentsRemoteMock,
} = vi.hoisted(() => ({
  fetchProgramSchedulesViaDashboardRemoteMock: vi.fn(),
  fetchAttendancesByScheduleIdsRemoteMock: vi.fn(),
  bulkUpsertProgramAttendancesRemoteMock: vi.fn(),
  fetchOrganizationScheduleAssignmentsRemoteMock: vi.fn(),
}))

vi.mock('@/features/program/general/api/program-progress-api-client', () => ({
  fetchProgramSchedulesViaDashboardRemote: fetchProgramSchedulesViaDashboardRemoteMock,
  fetchAttendancesByScheduleIdsRemote: fetchAttendancesByScheduleIdsRemoteMock,
  bulkUpsertProgramAttendancesRemote: bulkUpsertProgramAttendancesRemoteMock,
}))

vi.mock('@/features/program/general/api/organization-schedule-assignments-api-client', () => ({
  fetchOrganizationScheduleAssignmentsRemote: fetchOrganizationScheduleAssignmentsRemoteMock,
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
    fetchOrganizationScheduleAssignmentsRemoteMock.mockReset()
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
    expect(fetchAttendancesByScheduleIdsRemoteMock).toHaveBeenCalledWith('p1', [10, 11], {})
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

  it('keeps education sessions as not-held when attendance rows are empty', async () => {
    fetchProgramSchedulesViaDashboardRemoteMock.mockResolvedValue([
      { scheduleId: 10, sessionNo: 1 },
      { scheduleId: 11, sessionNo: 2 },
      {
        scheduleId: 12,
        sessionNo: 3,
        allDay: true,
        startAt: '2026-03-01T00:00:00+09:00',
        endAt: '2026-03-05T00:00:00+09:00',
      },
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
      { roundNumber: 2, scheduleId: 11, status: 'not_held' },
    ])
    expect(detail.attendanceRatePercent).toBe(100)
    expect(fetchOrganizationScheduleAssignmentsRemoteMock).not.toHaveBeenCalled()
  })

  it('uses organization assigned schedules and still shows rounds without attendance', async () => {
    fetchProgramSchedulesViaDashboardRemoteMock.mockResolvedValue([
      { scheduleId: 10, sessionNo: 1, startAt: '2020-01-01T09:00:00+09:00' },
      { scheduleId: 11, sessionNo: 2 },
      { scheduleId: 99, sessionNo: 9 },
    ])
    fetchOrganizationScheduleAssignmentsRemoteMock.mockResolvedValue([
      {
        scheduleId: 11,
        assignmentStatus: 'CONFIRMED',
        organizationApplicationId: 501,
        programId: 1,
      },
      {
        scheduleId: 10,
        assignmentStatus: 'CONFIRMED',
        organizationApplicationId: 501,
        programId: 1,
      },
    ])
    fetchAttendancesByScheduleIdsRemoteMock.mockResolvedValue({})

    const detail = await fetchStudentLectureAttendanceByParticipantRemote({
      programId: '1',
      participantId: 77,
      studentName: '김학생',
      organizationApplicationId: '501',
    })

    expect(detail.sessions.map(session => session.scheduleId)).toEqual([10, 11])
    expect(detail.sessions.every(session => session.status === 'not_held')).toBe(true)
    expect(detail.sessions[0]?.recordingOpen).toBe(true)
    expect(detail.sessions[1]?.recordingOpen).toBeUndefined()
    expect(detail.attendanceRatePercent).toBe(0)
    expect(fetchAttendancesByScheduleIdsRemoteMock).toHaveBeenCalledWith('1', [10, 11], {
      organizationApplicationId: '501',
    })
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
