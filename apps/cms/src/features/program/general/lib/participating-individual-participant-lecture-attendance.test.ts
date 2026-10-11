import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  fetchProgramSchedulesViaDashboardRemoteMock,
  fetchAttendancesByScheduleIdsRemoteMock,
} = vi.hoisted(() => ({
  fetchProgramSchedulesViaDashboardRemoteMock: vi.fn(),
  fetchAttendancesByScheduleIdsRemoteMock: vi.fn(),
}))

vi.mock('@/features/program/general/api/program-progress-api-client', () => ({
  fetchProgramSchedulesViaDashboardRemote: fetchProgramSchedulesViaDashboardRemoteMock,
  fetchAttendancesByScheduleIdsRemote: fetchAttendancesByScheduleIdsRemoteMock,
}))

import {
  hydrateParticipatingIndividualLectureAttendanceSessions,
  mapParticipantAttendanceStatusToLectureCertificate,
  mapSessionProgressToLectureAttendanceSessions,
} from './participating-individual-participant-lecture-attendance'

describe('participating-individual-participant-lecture-attendance', () => {
  beforeEach(() => {
    fetchProgramSchedulesViaDashboardRemoteMock.mockReset()
    fetchAttendancesByScheduleIdsRemoteMock.mockReset()
  })

  it('maps participant attendance and treats excused as attended', () => {
    expect(mapParticipantAttendanceStatusToLectureCertificate('PRESENT')).toBe('attended')
    expect(mapParticipantAttendanceStatusToLectureCertificate('LATE')).toBe('late')
    expect(mapParticipantAttendanceStatusToLectureCertificate('ABSENT')).toBe('absent')
    expect(mapParticipantAttendanceStatusToLectureCertificate('EXCUSED')).toBe('attended')
    expect(mapParticipantAttendanceStatusToLectureCertificate('COMPLETED')).toBeNull()
    expect(mapParticipantAttendanceStatusToLectureCertificate('SCHEDULED')).toBeNull()
  })

  it('maps session attendance and skips schedule-progress COMPLETED', () => {
    const sessions = mapSessionProgressToLectureAttendanceSessions([
      { sessionNo: 1, scheduleId: 10, attendanceStatus: 'PRESENT' },
      { sessionNo: 2, scheduleId: 11, attendanceStatus: 'COMPLETED' },
      { sessionNo: 3, scheduleId: 12, attendanceStatus: 'ABSENT' },
    ])

    expect(sessions).toEqual([
      { roundNumber: 1, scheduleId: 10, status: 'attended' },
      { roundNumber: 3, scheduleId: 12, status: 'absent' },
    ])
  })

  it('keeps existing lecture sessions and does not refetch', async () => {
    const existing = [{ roundNumber: 1, status: 'attended' as const }]
    const sessions = await hydrateParticipatingIndividualLectureAttendanceSessions({
      programId: '168001',
      participantId: '1691701',
      existing,
    })

    expect(sessions).toBe(existing)
    expect(fetchProgramSchedulesViaDashboardRemoteMock).not.toHaveBeenCalled()
  })

  it('hydrates from schedule attendances when list sessions have no person attendance', async () => {
    fetchProgramSchedulesViaDashboardRemoteMock.mockResolvedValue([
      { scheduleId: 10, sessionNo: 1 },
      { scheduleId: 11, sessionNo: 2 },
    ])
    fetchAttendancesByScheduleIdsRemoteMock.mockResolvedValue({
      '10': [{ participantId: 1691701, status: 'PRESENT' }],
      '11': [{ participantId: 1691701, status: 'EXCUSED' }],
    })

    const sessions = await hydrateParticipatingIndividualLectureAttendanceSessions({
      programId: '168001',
      participantId: '1691701',
      existing: [],
    })

    expect(sessions).toEqual([
      { roundNumber: 1, scheduleId: 10, status: 'attended' },
      { roundNumber: 2, scheduleId: 11, status: 'attended' },
    ])
    expect(fetchAttendancesByScheduleIdsRemoteMock).toHaveBeenCalledTimes(1)
    expect(fetchAttendancesByScheduleIdsRemoteMock).toHaveBeenCalledWith('168001', [10, 11])
  })

  it('bulk 출석 조회 실패 시 오류를 전파한다', async () => {
    fetchProgramSchedulesViaDashboardRemoteMock.mockResolvedValue([
      { scheduleId: 10, sessionNo: 1 },
    ])
    fetchAttendancesByScheduleIdsRemoteMock.mockRejectedValue(new Error('403'))

    await expect(
      hydrateParticipatingIndividualLectureAttendanceSessions({
        programId: '168001',
        participantId: '1691701',
        existing: [],
      })
    ).rejects.toThrow('403')
  })
})
