import { describe, expect, it } from 'vitest'
import {
  buildProgressAttendanceSessionsFromRemote,
  mapApiAttendanceStatusToUi,
  mapDashboardScheduleStatusToEducationProgress,
} from '@/features/program/general/api/adapters/progress-attendance-adapters'

describe('progress-attendance-adapters', () => {
  it('does not treat empty or schedule-progress values as present', () => {
    expect(mapApiAttendanceStatusToUi(undefined)).toBeNull()
    expect(mapApiAttendanceStatusToUi(null)).toBeNull()
    expect(mapApiAttendanceStatusToUi('')).toBeNull()
    expect(mapApiAttendanceStatusToUi('COMPLETED')).toBeNull()
    expect(mapApiAttendanceStatusToUi('SCHEDULED')).toBeNull()
    expect(mapApiAttendanceStatusToUi('UNKNOWN_CODE')).toBeNull()
  })

  it('maps attendance API codes', () => {
    expect(mapApiAttendanceStatusToUi('PRESENT')).toBe('present')
    expect(mapApiAttendanceStatusToUi('LATE')).toBe('late')
    expect(mapApiAttendanceStatusToUi('ABSENT')).toBe('absent')
    expect(mapApiAttendanceStatusToUi('EXCUSED')).toBe('excused_absence')
  })

  it('maps schedule status to education progress independently of attendance', () => {
    expect(mapDashboardScheduleStatusToEducationProgress('COMPLETED')).toBe('completed')
    expect(mapDashboardScheduleStatusToEducationProgress('SCHEDULED')).toBe('scheduled')
  })

  it('marks participants without attendance records as unrecorded', () => {
    const sessions = buildProgressAttendanceSessionsFromRemote({
      schedules: [
        {
          scheduleId: 9001,
          sessionNo: 1,
          scheduleStatus: 'COMPLETED',
          startAt: '2026-10-15T00:00:00+09:00',
          endAt: '2026-10-15T23:59:00+09:00',
        },
      ],
      participants: [{ participantId: 1694745, memberName: '일반회원2', participantType: 'INDIVIDUAL' }],
      attendancesByScheduleId: {
        '9001': [{ participantId: 1694745, status: null }],
      },
    })

    expect(sessions).toHaveLength(1)
    expect(sessions[0]?.scheduleEducationProgress).toBe('completed')
    const row = sessions[0]?.participants[0]
    expect(row?.attendanceRecorded).toBe(false)
    expect(row?.attendanceStatus).toBeUndefined()
  })

  it('does not render schedules missing from the attendance response', () => {
    const sessions = buildProgressAttendanceSessionsFromRemote({
      schedules: [
        { scheduleId: 9001, sessionNo: 1, scheduleStatus: 'COMPLETED' },
        { scheduleId: 9002, sessionNo: 2, scheduleStatus: 'COMPLETED' },
      ],
      participants: [{ participantId: 1, memberName: '학생', participantType: 'INDIVIDUAL' }],
      attendancesByScheduleId: {
        '9001': [{ participantId: 1, status: 'PRESENT' }],
        '9002': [],
      },
    })

    expect(sessions.map(session => session.id)).toEqual(['9001'])
  })

  it('maps participant roster fields for attendance table columns', () => {
    const sessions = buildProgressAttendanceSessionsFromRemote({
      schedules: [
        {
          scheduleId: 9001,
          sessionNo: 1,
          scheduleStatus: 'IN_PROGRESS',
          startAt: '2026-10-01T10:00:00+09:00',
        },
      ],
      participants: [
        {
          participantId: 1694745,
          memberName: '일반회원2',
          participantType: 'INDIVIDUAL',
          gender: 'FEMALE',
          birthDate: '2010-05-12',
          organizationName: '○○초등학교',
          grade: '5학년',
          phone: '010-1234-5678',
          email: 'member2@example.com',
        },
      ],
      attendancesByScheduleId: {
        '9001': [{ participantId: 1694745, status: 'PRESENT' }],
      },
    })

    const row = sessions[0]?.participants[0]
    expect(row?.genderBirthLabel).toContain('여')
    expect(row?.genderBirthLabel).toContain('2010.05.12')
    expect(row?.affiliationGradeLabel).toContain('○○초등학교')
    expect(row?.affiliationGradeLabel).toContain('5학년')
    expect(row?.contact).toBe('010-1234-5678')
    expect(row?.email).toBe('member2@example.com')
    expect(row?.attendanceStatus).toBe('present')
  })

  it('hides attendance before the session starts even when API returns PRESENT', () => {
    const sessions = buildProgressAttendanceSessionsFromRemote({
      schedules: [
        {
          scheduleId: 9001,
          sessionNo: 1,
          scheduleStatus: 'SCHEDULED',
          startAt: '2026-10-15T10:00:00+09:00',
        },
      ],
      participants: [{ participantId: 1, memberName: '일반회원2', participantType: 'INDIVIDUAL' }],
      attendancesByScheduleId: {
        '9001': [{ participantId: 1, status: 'PRESENT' }],
      },
    })

    const row = sessions[0]?.participants[0]
    expect(row?.attendanceRecorded).toBe(false)
    expect(row?.attendanceStatus).toBeUndefined()
    expect(sessions[0]?.attendanceRecordingOpen).toBe(false)
  })

  it('treats attendance row with null status as unrecorded when recording is open', () => {
    const sessions = buildProgressAttendanceSessionsFromRemote({
      schedules: [
        {
          scheduleId: 9001,
          sessionNo: 1,
          scheduleStatus: 'IN_PROGRESS',
          startAt: '2026-10-01T10:00:00+09:00',
        },
      ],
      participants: [{ participantId: 1, memberName: '일반회원2', participantType: 'INDIVIDUAL' }],
      attendancesByScheduleId: {
        '9001': [{ participantId: 1, status: undefined }],
      },
    })

    const row = sessions[0]?.participants[0]
    expect(sessions[0]?.attendanceRecordingOpen).toBe(true)
    expect(row?.attendanceRecorded).toBe(false)
    expect(row?.attendanceStatus).toBeUndefined()
  })
})
