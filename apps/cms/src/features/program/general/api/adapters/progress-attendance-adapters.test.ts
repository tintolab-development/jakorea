import { describe, expect, it } from 'vitest'
import {
  buildProgressAttendanceSessionsFromRemote,
  mapApiAttendanceStatusToUi,
  mapDashboardScheduleStatusToEducationProgress,
} from '@/features/program/general/api/adapters/progress-attendance-adapters'

describe('progress-attendance-adapters', () => {
  it('does not treat empty or schedule-progress values as present', () => {
    expect(mapApiAttendanceStatusToUi(undefined)).toBeNull()
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
        '9001': [{ participantId: 1694745, status: 'COMPLETED' }],
      },
    })

    expect(sessions).toHaveLength(1)
    expect(sessions[0]?.scheduleEducationProgress).toBe('completed')
    const row = sessions[0]?.participants[0]
    expect(row?.attendanceRecorded).toBe(false)
    expect(row?.attendanceStatus).toBeUndefined()
  })
})
