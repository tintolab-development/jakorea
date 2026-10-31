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

  it('renders every program schedule table and keeps unassigned schedules empty', () => {
    const sessions = buildProgressAttendanceSessionsFromRemote({
      schedules: [
        { scheduleId: 9001, sessionNo: 1, scheduleStatus: 'COMPLETED' },
        { scheduleId: 9002, sessionNo: 2, scheduleStatus: 'COMPLETED' },
        { scheduleId: 9003, sessionNo: 3, scheduleStatus: 'SCHEDULED' },
      ],
      participants: [{ participantId: 1, memberName: '학생', participantType: 'INDIVIDUAL' }],
      attendancesByScheduleId: {
        '9001': [{ participantId: 1, status: 'PRESENT' }],
        '9002': [],
      },
    })

    expect(sessions.map(session => session.id)).toEqual(['9001', '9002', '9003'])
    expect(sessions[0]?.participants).toHaveLength(1)
    expect(sessions[1]?.participants).toEqual([])
    expect(sessions[2]?.participants).toEqual([])
  })

  it('puts a participant only on assigned schedules, even without attendance yet', () => {
    const sessions = buildProgressAttendanceSessionsFromRemote({
      schedules: [
        { scheduleId: 9001, sessionNo: 1, scheduleStatus: 'IN_PROGRESS' },
        { scheduleId: 9002, sessionNo: 2, scheduleStatus: 'IN_PROGRESS' },
      ],
      participants: [
        {
          participantId: 1,
          memberName: '배정된사람',
          participantType: 'INDIVIDUAL',
          sessions: [{ scheduleId: 9002, resolvedScheduleId: 9002 }],
        },
        {
          participantId: 2,
          memberName: '다른일정',
          participantType: 'INDIVIDUAL',
          sessions: [{ scheduleId: 9001 }],
        },
      ],
      attendancesByScheduleId: {},
    })

    expect(sessions[0]?.participants.map(row => row.name)).toEqual(['다른일정'])
    expect(sessions[1]?.participants.map(row => row.name)).toEqual(['배정된사람'])
    expect(sessions[1]?.participants[0]?.attendanceRecorded).toBe(false)
  })

  it('drops the curriculum period window so 공통 교육 예정 1 becomes 1회차', () => {
    const sessions = buildProgressAttendanceSessionsFromRemote({
      schedules: [
        {
          scheduleId: 187270,
          sessionNo: 1,
          scheduleName: '개커복날 강사테슽 커리큘럼',
          startAt: '2026-10-23T15:00:00Z',
          endAt: '2026-12-24T14:59:59.999Z',
          allDay: true,
          scheduleStatus: 'COMPLETED',
        },
        {
          scheduleId: 187271,
          sessionNo: undefined,
          scheduleName: '공통 교육 예정 1',
          startAt: '2026-10-24T07:00:00Z',
          endAt: '2026-10-24T07:02:00Z',
          allDay: false,
          scheduleStatus: 'COMPLETED',
        },
        {
          scheduleId: 187272,
          sessionNo: 2,
          scheduleName: '공통 교육 예정 2',
          startAt: '2026-10-24T07:05:00Z',
          endAt: '2026-10-24T07:06:00Z',
          allDay: false,
          scheduleStatus: 'COMPLETED',
        },
        {
          scheduleId: 187273,
          sessionNo: 3,
          scheduleName: '공통 교육 예정 3',
          startAt: '2026-10-24T07:10:00Z',
          endAt: '2026-10-24T07:11:00Z',
          allDay: false,
          scheduleStatus: 'COMPLETED',
        },
      ],
      participants: [
        {
          participantId: 1,
          memberName: '일반회원',
          participantType: 'INDIVIDUAL',
          sessions: [{ scheduleId: 187271 }, { scheduleId: 187272 }, { scheduleId: 187273 }],
        },
      ],
      attendancesByScheduleId: {},
    })

    expect(sessions.map(session => session.id)).toEqual(['187271', '187272', '187273'])
    expect(sessions.map(session => session.headerTitle)).toEqual([
      '1회차 : 2026.10.24(토)',
      '2회차 : 2026.10.24(토)',
      '3회차 : 2026.10.24(토)',
    ])
  })

  it('hides a give-up participant from schedules after the give-up day', () => {
    const sessions = buildProgressAttendanceSessionsFromRemote({
      schedules: [
        {
          scheduleId: 1,
          sessionNo: 1,
          startAt: '2026-01-09T09:20:00+09:00',
          endAt: '2026-01-09T11:10:00+09:00',
          scheduleStatus: 'COMPLETED',
        },
        {
          scheduleId: 2,
          sessionNo: 2,
          startAt: '2026-01-16T09:20:00+09:00',
          endAt: '2026-01-16T11:10:00+09:00',
          scheduleStatus: 'COMPLETED',
        },
      ],
      participants: [
        {
          participantId: 10,
          memberName: '포기자',
          participantType: 'INDIVIDUAL',
          participantStatus: 'GIVE_UP',
          giveUpAt: '2026-01-09T18:00:00+09:00',
          sessions: [{ scheduleId: 1 }, { scheduleId: 2 }],
        },
        {
          participantId: 11,
          memberName: '진행자',
          participantType: 'INDIVIDUAL',
          sessions: [{ scheduleId: 1 }, { scheduleId: 2 }],
        },
      ],
      attendancesByScheduleId: {},
    })

    expect(sessions[0]?.headerTitle).toBe('1회차 : 2026.01.09(금)')
    expect(sessions[0]?.headerScheduleSummary).toBe('110분')
    expect(sessions[0]?.headerPeriodRangeLabel).toBe('09:20 ~ 11:10')
    expect(sessions[0]?.participants.map(row => row.name)).toEqual(['포기자', '진행자'])
    expect(sessions[1]?.participants.map(row => row.name)).toEqual(['진행자'])
  })

  it('drops schedules without scheduleId and still shows empty roster tables', () => {
    const sessions = buildProgressAttendanceSessionsFromRemote({
      schedules: [
        { scheduleId: undefined, sessionNo: 1, scheduleStatus: 'COMPLETED' },
        { scheduleId: 9002, sessionNo: 2, scheduleStatus: 'COMPLETED' },
      ],
      participants: [],
      attendancesByScheduleId: {},
    })

    expect(sessions.map(session => session.id)).toEqual(['9002'])
    expect(sessions[0]?.participants).toEqual([])
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

  it('keeps a masked participant gender as returned', () => {
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
          participantId: 1694746,
          memberName: '마스킹',
          participantType: 'INDIVIDUAL',
          gender: '*',
          birthDate: null,
        },
      ],
      attendancesByScheduleId: {
        '9001': [{ participantId: 1694746, status: 'PRESENT' }],
      },
    })

    expect(sessions[0]?.participants[0]?.genderBirthLabel.startsWith('*')).toBe(true)
  })

  it('hides attendance before the session starts even when API returns PRESENT', () => {
    const sessions = buildProgressAttendanceSessionsFromRemote({
      schedules: [
        {
          scheduleId: 9001,
          sessionNo: 1,
          scheduleStatus: 'SCHEDULED',
          startAt: '2099-10-15T10:00:00+09:00',
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

  it('shows SYSTEM auto-check-in PRESENT as 출석 after start, with no source badge field', () => {
    const sessions = buildProgressAttendanceSessionsFromRemote({
      schedules: [
        {
          scheduleId: 9001,
          sessionNo: 1,
          scheduleStatus: 'IN_PROGRESS',
          startAt: '2026-10-01T10:00:00+09:00',
        },
      ],
      participants: [{ participantId: 1695036, memberName: '개인', participantType: 'INDIVIDUAL' }],
      attendancesByScheduleId: {
        '9001': [
          {
            participantId: 1695036,
            status: 'PRESENT',
            checkInSource: 'SYSTEM',
            checkedByAdminId: undefined,
          },
        ],
      },
    })

    const row = sessions[0]?.participants[0]
    expect(row?.attendanceRecorded).toBe(true)
    expect(row?.attendanceStatus).toBe('present')
    expect(row).not.toHaveProperty('checkInSource')
  })

  it('opens attendance after start time even when schedule status is still SCHEDULED', () => {
    const sessions = buildProgressAttendanceSessionsFromRemote({
      schedules: [
        {
          scheduleId: 9002,
          sessionNo: 2,
          scheduleStatus: 'SCHEDULED',
          startAt: '2026-10-27T03:55:00+09:00',
        },
      ],
      participants: [{ participantId: 1, memberName: '일반회원2', participantType: 'INDIVIDUAL' }],
      attendancesByScheduleId: {
        '9002': [{ participantId: 1, status: 'PRESENT' }],
      },
    })

    expect(sessions[0]?.attendanceRecordingOpen).toBe(true)
    expect(sessions[0]?.participants[0]?.attendanceRecorded).toBe(true)
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
