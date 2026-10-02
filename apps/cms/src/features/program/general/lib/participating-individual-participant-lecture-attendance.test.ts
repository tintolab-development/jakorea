import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  fetchProgramSchedulesViaDashboardRemoteMock,
  fetchScheduleAttendancesRemoteMock,
} = vi.hoisted(() => ({
  fetchProgramSchedulesViaDashboardRemoteMock: vi.fn(),
  fetchScheduleAttendancesRemoteMock: vi.fn(),
}))

vi.mock('@/features/program/general/api/program-progress-api-client', () => ({
  fetchProgramSchedulesViaDashboardRemote: fetchProgramSchedulesViaDashboardRemoteMock,
  fetchScheduleAttendancesRemote: fetchScheduleAttendancesRemoteMock,
}))

import {
  hydrateParticipatingIndividualLectureAttendanceSessions,
  mapParticipantAttendanceStatusToLectureCertificate,
  mapSessionProgressToLectureAttendanceSessions,
} from './participating-individual-participant-lecture-attendance'

describe('participating-individual-participant-lecture-attendance', () => {
  beforeEach(() => {
    fetchProgramSchedulesViaDashboardRemoteMock.mockReset()
    fetchScheduleAttendancesRemoteMock.mockReset()
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
    fetchScheduleAttendancesRemoteMock
      .mockResolvedValueOnce([{ participantId: 1691701, status: 'PRESENT' }])
      .mockResolvedValueOnce([{ participantId: 1691701, status: 'EXCUSED' }])

    const sessions = await hydrateParticipatingIndividualLectureAttendanceSessions({
      programId: '168001',
      participantId: '1691701',
      existing: [],
    })

    expect(sessions).toEqual([
      { roundNumber: 1, scheduleId: 10, status: 'attended' },
      { roundNumber: 2, scheduleId: 11, status: 'attended' },
    ])
  })
})
