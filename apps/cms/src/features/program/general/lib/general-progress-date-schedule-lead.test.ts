import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import type { DashboardProgramScheduleResponse } from '@/shared/api/generated/dashboard/schemas/dashboardProgramScheduleResponse'
import { buildProgressAttendanceSessionsFromRemote } from '@/features/program/general/api/adapters/progress-attendance-adapters'
import { buildProgressAssignmentSessionsFromRemote } from '@/features/program/general/api/adapters/progress-assignment-adapters'
import {
  isGeneralScheduleSingleDateProgram,
  resolveGeneralScheduleSingleDateDetailName,
} from '@/features/program/general/lib/general-progress-date-schedule-lead'
import { resolveProgressAttendanceScheduleDateRanges } from '@/features/program/general/lib/progress-attendance-schedule-date-ranges'

/** 186486 (⑤ 일정형·단일·날짜, 개인) 실데이터 축약 */
function scheduleSingleDateProgram(overrides: Partial<Program> = {}): Program {
  return {
    id: '186486',
    startDate: '2026-10-01',
    endDate: '2026-12-30',
    generalProgramAudience: 'individual',
    generalProgramEducationStructure: 'schedule',
    generalProgramSessionRound: 'single',
    generalCommonInfo: {
      educationScheduleMode: 'date',
      educationFormLabel: '오프라인',
      curriculumSessions: [],
      scheduleDetails: [
        {
          name: '사전 교육',
          blockKind: 'preEducation',
          scheduleLabel: '사전 교육',
          scheduleDateLabel: '2026.10.30(금) 12:00 ~ 13:08',
          educationFormLabel: '온라인',
        },
        {
          name: '필요와 욕구, 현명한 소비',
          scheduleLabel: '세부 일정 01',
          scheduleDateLabel: '2026.11.16(월) 10:00 ~ 12:00',
          progressTimeSummary: '그룹 A : 13:30 ~ 15:30 | 그룹 B : 09:30 ~ 11:30',
        },
      ],
    },
    ...overrides,
  } as unknown as Program
}

const SCHEDULES_186486: DashboardProgramScheduleResponse[] = [
  { scheduleId: 187543, sessionNo: 4, scheduleName: '공통 교육 예정 4', startAt: '2026-10-30T00:30:00Z', endAt: '2026-10-30T02:30:00Z', allDay: false, scheduleStatus: 'COMPLETED' },
  { scheduleId: 187542, sessionNo: 3, scheduleName: '공통 교육 예정 3', startAt: '2026-10-30T04:30:00Z', endAt: '2026-10-30T06:30:00Z', allDay: false, scheduleStatus: 'COMPLETED' },
  { scheduleId: 187545, sessionNo: 6, scheduleName: '공통 교육 예정 6', startAt: '2026-10-31T00:30:00Z', endAt: '2026-10-31T02:30:00Z', allDay: false, scheduleStatus: 'SCHEDULED' },
  { scheduleId: 187544, sessionNo: 5, scheduleName: '공통 교육 예정 5', startAt: '2026-10-31T04:30:00Z', endAt: '2026-10-31T06:30:00Z', allDay: false, scheduleStatus: 'SCHEDULED' },
  { scheduleId: 187541, sessionNo: 2, scheduleName: '공통 교육 예정 2', startAt: '2026-11-16T00:30:00Z', endAt: '2026-11-16T02:30:00Z', allDay: false, scheduleStatus: 'SCHEDULED' },
  { scheduleId: 187540, sessionNo: 1, scheduleName: '공통 교육 예정 1', startAt: '2026-11-16T04:30:00Z', endAt: '2026-11-16T06:30:00Z', allDay: false, scheduleStatus: 'SCHEDULED' },
]

const NAME = '필요와 욕구, 현명한 소비'

describe('general-progress-date-schedule-lead (⑤ 일정형·단일·날짜)', () => {
  it('detects only schedule + single + date', () => {
    expect(isGeneralScheduleSingleDateProgram(scheduleSingleDateProgram())).toBe(true)
    expect(
      isGeneralScheduleSingleDateProgram(
        scheduleSingleDateProgram({ generalProgramSessionRound: 'multi' } as Partial<Program>)
      )
    ).toBe(false)
    const period = scheduleSingleDateProgram()
    period.generalCommonInfo = { ...period.generalCommonInfo!, educationScheduleMode: 'period' }
    expect(isGeneralScheduleSingleDateProgram(period)).toBe(false)
    expect(isGeneralScheduleSingleDateProgram(null)).toBe(false)
  })

  it('needs the 세부 일정 date and a group time to both match; skips 사전 교육', () => {
    const program = scheduleSingleDateProgram()
    // 10/30·10/31: 그룹 시간은 같지만 세부 일정 날짜(11/16)와 다름
    expect(resolveGeneralScheduleSingleDateDetailName(program, SCHEDULES_186486[0]!)).toBe('')
    expect(resolveGeneralScheduleSingleDateDetailName(program, SCHEDULES_186486[3]!)).toBe('')
    // 11/16 09:30~11:30(그룹 B) · 13:30~15:30(그룹 A)
    expect(resolveGeneralScheduleSingleDateDetailName(program, SCHEDULES_186486[4]!)).toBe(NAME)
    expect(resolveGeneralScheduleSingleDateDetailName(program, SCHEDULES_186486[5]!)).toBe(NAME)
    // 사전 교육 시간(10/30 12:00~13:08)은 이름을 붙이지 않음
    expect(
      resolveGeneralScheduleSingleDateDetailName(program, {
        startAt: '2026-10-30T03:00:00Z',
        endAt: '2026-10-30T04:08:00Z',
      })
    ).toBe('')
  })

  it('does not append a name when the 세부 일정 date is unknown', () => {
    const program = scheduleSingleDateProgram()
    program.generalCommonInfo!.scheduleDetails = [
      {
        name: NAME,
        scheduleLabel: '세부 일정 01',
        progressTimeSummary: '그룹 A : 13:30 ~ 15:30 | 그룹 B : 09:30 ~ 11:30',
      },
    ]
    expect(resolveGeneralScheduleSingleDateDetailName(program, SCHEDULES_186486[4]!)).toBe('')
  })

  it('appends nothing when two different 세부 일정 match the same date·time', () => {
    const program = scheduleSingleDateProgram()
    program.generalCommonInfo!.scheduleDetails!.push({
      name: '다른 세부 일정',
      scheduleLabel: '세부 일정 02',
      scheduleDateLabel: '2026.11.16(월)',
      progressTimeSummary: '그룹 A : 09:30 ~ 11:30',
    })
    expect(resolveGeneralScheduleSingleDateDetailName(program, SCHEDULES_186486[4]!)).toBe('')
    expect(resolveGeneralScheduleSingleDateDetailName(program, SCHEDULES_186486[5]!)).toBe(NAME)
  })

  it('accepts 진행 일정 date + time and the 26년 M월 D일 format', () => {
    const program = scheduleSingleDateProgram()
    program.generalCommonInfo!.scheduleDetails = [
      { name: '행사', scheduleLabel: '세부 일정 01', scheduleDateLabel: '26년 10월 31일(토) 09:30 ~ 11:30' },
    ]
    expect(resolveGeneralScheduleSingleDateDetailName(program, SCHEDULES_186486[2]!)).toBe('행사')
    expect(resolveGeneralScheduleSingleDateDetailName(program, SCHEDULES_186486[3]!)).toBe('')
  })

  it('builds attendance headers as 일시 ㅣ 일정명 in server order without 세부 일정 NN', () => {
    const sessions = buildProgressAttendanceSessionsFromRemote({
      schedules: SCHEDULES_186486,
      participants: [],
      attendancesByScheduleId: {},
      program: scheduleSingleDateProgram(),
    })
    expect(sessions.map(session => session.id)).toEqual([
      '187543', '187542', '187545', '187544', '187541', '187540',
    ])
    expect(sessions.map(session => session.headerTitle)).toEqual([
      '2026.10.30(금)',
      '2026.10.30(금)',
      '2026.10.31(토)',
      '2026.10.31(토)',
      `2026.11.16(월) ㅣ ${NAME}`,
      `2026.11.16(월) ㅣ ${NAME}`,
    ])
    expect(sessions.map(session => session.filterLabel)).toEqual([
      '2026.10.30(금) 09:30 ~ 11:30',
      '2026.10.30(금) 13:30 ~ 15:30',
      '2026.10.31(토) 09:30 ~ 11:30',
      '2026.10.31(토) 13:30 ~ 15:30',
      `2026.11.16(월) 09:30 ~ 11:30 ㅣ ${NAME}`,
      `2026.11.16(월) 13:30 ~ 15:30 ㅣ ${NAME}`,
    ])
    expect(sessions.map(session => session.headerPeriodRangeLabel)).toEqual([
      '09:30 ~ 11:30', '13:30 ~ 15:30', '09:30 ~ 11:30', '13:30 ~ 15:30', '09:30 ~ 11:30', '13:30 ~ 15:30',
    ])
    expect(sessions.every(session => session.headerScheduleSummary === '2시간 (오프라인)')).toBe(true)
    expect(sessions.some(session => /세부 일정|공통 교육 예정|회차| : /u.test(session.headerPrefix))).toBe(false)
  })

  it('uses the same 일시 ㅣ 일정명 header on the assignment tab', () => {
    const sessions = buildProgressAssignmentSessionsFromRemote(
      {
        items: [
          { ...SCHEDULES_186486[0]!, assignmentEnabled: true, participants: [] },
          { ...SCHEDULES_186486[4]!, assignmentEnabled: true, participants: [] },
        ],
      },
      { program: scheduleSingleDateProgram() }
    )
    expect(sessions.map(session => session.headerTitle)).toEqual([
      '2026.10.30(금)',
      `2026.11.16(월) ㅣ ${NAME}`,
    ])
    expect(sessions.some(session => /세부 일정|공통 교육 예정|회차/u.test(session.headerPrefix))).toBe(false)
  })
})

describe('resolveProgressAttendanceScheduleDateRanges', () => {
  it('covers the operation period and the schedule line dates', () => {
    const program = scheduleSingleDateProgram()
    program.generalCommonInfo!.educationScheduleLines = [
      '26년 11월 16일(월) 13:30 ~ 15:30',
      '26년 10월 30일(금) 09:30 ~ 11:30',
    ]
    expect(resolveProgressAttendanceScheduleDateRanges(program)).toEqual([
      { dateFrom: '2026-10-01', dateTo: '2026-12-30' },
    ])
  })

  it('widens to schedules outside the operation period', () => {
    const program = scheduleSingleDateProgram({
      rounds: [
        { id: 'r1', programId: '186486', roundNumber: 1, startDate: '2026-09-20', endDate: '2026-09-20', status: 'pending' },
      ],
    } as Partial<Program>)
    program.generalCommonInfo!.educationScheduleLines = ['27년 1월 5일(화) 09:30 ~ 11:30']
    expect(resolveProgressAttendanceScheduleDateRanges(program)).toEqual([
      { dateFrom: '2026-09-20', dateTo: '2027-01-05' },
    ])
  })

  it('splits ranges longer than 365 days and returns [] without any date', () => {
    expect(
      resolveProgressAttendanceScheduleDateRanges({ startDate: '2026-01-01', endDate: '2027-06-30' })
    ).toEqual([
      { dateFrom: '2026-01-01', dateTo: '2027-01-01' },
      { dateFrom: '2027-01-02', dateTo: '2027-06-30' },
    ])
    expect(resolveProgressAttendanceScheduleDateRanges({ startDate: '', endDate: '' })).toEqual([])
  })
})
