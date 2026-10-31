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

  it('matches a regular 세부 일정 by group time only — 186486 all 6 schedules get the name', () => {
    const program = scheduleSingleDateProgram()
    // 세부 일정 진행 일정 날짜(11/16)는 보지 않고 그룹 A 13:30~15:30 · 그룹 B 09:30~11:30만 본다.
    expect(
      SCHEDULES_186486.map(schedule => resolveGeneralScheduleSingleDateDetailName(program, schedule))
    ).toEqual([NAME, NAME, NAME, NAME, NAME, NAME])
    // 그룹 시간과 다른 시각은 이름 없음(세부 일정 라벨 시각 10:00~12:00도 쓰지 않음)
    expect(
      resolveGeneralScheduleSingleDateDetailName(program, {
        startAt: '2026-11-16T01:00:00Z',
        endAt: '2026-11-16T03:00:00Z',
      })
    ).toBe('')
  })

  it('names a 사전교육 schedule 「사전교육」 (block date·time match or scheduleRole)', () => {
    const program = scheduleSingleDateProgram()
    // 사전 교육 블록 진행 일정(10/30 12:00~13:08)과 날짜·시각이 같은 일정
    expect(
      resolveGeneralScheduleSingleDateDetailName(program, {
        startAt: '2026-10-30T03:00:00Z',
        endAt: '2026-10-30T04:08:00Z',
      })
    ).toBe('사전교육')
    // 서버가 scheduleRole=PRE_EDUCATION을 주면 시각과 무관하게 「사전교육」
    expect(
      resolveGeneralScheduleSingleDateDetailName(program, {
        startAt: '2026-12-01T00:30:00Z',
        endAt: '2026-12-01T02:30:00Z',
        scheduleRole: 'PRE_EDUCATION',
      } as { startAt: string; endAt: string })
    ).toBe('사전교육')
  })

  it('renders a 사전교육 row as 「일시 ㅣ 사전교육」 on attendance', () => {
    const sessions = buildProgressAttendanceSessionsFromRemote({
      schedules: [
        { scheduleId: 190001, sessionNo: 7, scheduleName: '사전 교육', startAt: '2026-10-30T03:00:00Z', endAt: '2026-10-30T04:08:00Z', allDay: false, scheduleStatus: 'COMPLETED' },
        { scheduleId: 190002, sessionNo: 8, scheduleName: '공통 교육 예정 8', startAt: '2026-10-30T03:00:00Z', endAt: '2026-10-30T04:08:00Z', allDay: false, scheduleStatus: 'COMPLETED' },
      ],
      participants: [],
      attendancesByScheduleId: {},
      program: scheduleSingleDateProgram(),
    })
    expect(sessions.map(session => session.headerTitle)).toEqual([
      '2026.10.30(금) 12:00 ~ 13:08 ㅣ 사전교육',
      '2026.10.30(금) 12:00 ~ 13:08 ㅣ 사전교육',
    ])
    expect(sessions.map(session => session.filterLabel)).toEqual(
      sessions.map(session => session.headerTitle)
    )
    expect(sessions[0]?.headerPrefix.startsWith('2026.10.30(금) 12:00 ~ 13:08 ㅣ 사전교육 | ')).toBe(true)
  })

  it('still matches by group time when the 세부 일정 date is unknown', () => {
    const program = scheduleSingleDateProgram()
    program.generalCommonInfo!.scheduleDetails = [
      {
        name: NAME,
        scheduleLabel: '세부 일정 01',
        progressTimeSummary: '그룹 A : 13:30 ~ 15:30 | 그룹 B : 09:30 ~ 11:30',
      },
    ]
    expect(resolveGeneralScheduleSingleDateDetailName(program, SCHEDULES_186486[4]!)).toBe(NAME)
    expect(resolveGeneralScheduleSingleDateDetailName(program, SCHEDULES_186486[0]!)).toBe(NAME)
  })

  it('does not match a regular 세부 일정 without group times', () => {
    const program = scheduleSingleDateProgram()
    program.generalCommonInfo!.scheduleDetails = [
      { name: NAME, scheduleLabel: '세부 일정 01', scheduleDateLabel: '2026.11.16(월) 09:30 ~ 11:30' },
    ]
    expect(resolveGeneralScheduleSingleDateDetailName(program, SCHEDULES_186486[4]!)).toBe('')
  })

  it('appends nothing when two different 세부 일정 have the same group time (any date)', () => {
    const program = scheduleSingleDateProgram()
    program.generalCommonInfo!.scheduleDetails!.push({
      name: '다른 세부 일정',
      scheduleLabel: '세부 일정 02',
      scheduleDateLabel: '2026.12.01(화)',
      progressTimeSummary: '그룹 A : 13:30 ~ 15:30',
    })
    // 13:30~15:30은 두 세부 일정이 겹쳐 이름 없음, 09:30~11:30은 하나만 맞음
    expect(resolveGeneralScheduleSingleDateDetailName(program, SCHEDULES_186486[1]!)).toBe('')
    expect(resolveGeneralScheduleSingleDateDetailName(program, SCHEDULES_186486[5]!)).toBe('')
    expect(resolveGeneralScheduleSingleDateDetailName(program, SCHEDULES_186486[0]!)).toBe(NAME)
    expect(resolveGeneralScheduleSingleDateDetailName(program, SCHEDULES_186486[4]!)).toBe(NAME)
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

  it('matches a 사전 교육 block by date + time, including the 26년 M월 D일 format', () => {
    const program = scheduleSingleDateProgram()
    program.generalCommonInfo!.scheduleDetails = [
      {
        name: '사전 교육',
        blockKind: 'preEducation',
        scheduleLabel: '사전 교육',
        scheduleDateLabel: '26년 10월 31일(토) 09:30 ~ 11:30',
      },
    ]
    expect(resolveGeneralScheduleSingleDateDetailName(program, SCHEDULES_186486[2]!)).toBe('사전교육')
    // 같은 시각이라도 날짜가 다르면 사전교육이 아님
    expect(resolveGeneralScheduleSingleDateDetailName(program, SCHEDULES_186486[0]!)).toBe('')
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
      `2026.10.30(금) 09:30 ~ 11:30 ㅣ ${NAME}`,
      `2026.10.30(금) 13:30 ~ 15:30 ㅣ ${NAME}`,
      `2026.10.31(토) 09:30 ~ 11:30 ㅣ ${NAME}`,
      `2026.10.31(토) 13:30 ~ 15:30 ㅣ ${NAME}`,
      `2026.11.16(월) 09:30 ~ 11:30 ㅣ ${NAME}`,
      `2026.11.16(월) 13:30 ~ 15:30 ㅣ ${NAME}`,
    ])
    // 필터 라벨은 제목과 같다.
    expect(sessions.map(session => session.filterLabel)).toEqual(
      sessions.map(session => session.headerTitle)
    )
    expect(sessions.map(session => session.filterLabel)).toEqual([
      `2026.10.30(금) 09:30 ~ 11:30 ㅣ ${NAME}`,
      `2026.10.30(금) 13:30 ~ 15:30 ㅣ ${NAME}`,
      `2026.10.31(토) 09:30 ~ 11:30 ㅣ ${NAME}`,
      `2026.10.31(토) 13:30 ~ 15:30 ㅣ ${NAME}`,
      `2026.11.16(월) 09:30 ~ 11:30 ㅣ ${NAME}`,
      `2026.11.16(월) 13:30 ~ 15:30 ㅣ ${NAME}`,
    ])
    expect(sessions.map(session => session.headerPeriodRangeLabel)).toEqual([
      '09:30 ~ 11:30', '13:30 ~ 15:30', '09:30 ~ 11:30', '13:30 ~ 15:30', '09:30 ~ 11:30', '13:30 ~ 15:30',
    ])
    expect(sessions.every(session => session.headerScheduleSummary === '2시간 (오프라인)')).toBe(true)
    expect(sessions.some(session => /세부 일정|공통 교육 예정|회차| : /u.test(session.headerPrefix))).toBe(false)
    // 화면 옆 표기는 제목에 시간이 이미 있으면 시간을 뺀다(패널 규칙: 제목에 포함되는지로 판단).
    expect(sessions.every(session => session.headerTitle.includes(session.headerPeriodRangeLabel))).toBe(true)
    // 엑셀 머리글: 시간은 제목에 한 번만, 옆 요약은 `2시간 (오프라인)`만.
    expect(sessions[4]?.headerPrefix).toBe(`2026.11.16(월) 09:30 ~ 11:30 ㅣ ${NAME} | 2시간 (오프라인)`)
    expect(sessions[0]?.headerPrefix).toBe(`2026.10.30(금) 09:30 ~ 11:30 ㅣ ${NAME} | 2시간 (오프라인)`)
  })

  it('keeps a PRE_EDUCATION schedule on attendance (server order) but not on the assignment tab', () => {
    const preEducation = {
      scheduleId: 190003,
      sessionNo: 7,
      scheduleName: '사전 교육',
      startAt: '2026-10-30T03:00:00Z',
      endAt: '2026-10-30T04:08:00Z',
      allDay: false,
      scheduleStatus: 'COMPLETED',
      scheduleRole: 'PRE_EDUCATION',
    } as DashboardProgramScheduleResponse
    const attendance = buildProgressAttendanceSessionsFromRemote({
      schedules: [SCHEDULES_186486[0]!, preEducation, SCHEDULES_186486[4]!],
      participants: [],
      attendancesByScheduleId: {},
      program: scheduleSingleDateProgram(),
    })
    expect(attendance.map(session => session.id)).toEqual(['187543', '190003', '187541'])
    expect(attendance[1]?.headerTitle).toBe('2026.10.30(금) 12:00 ~ 13:08 ㅣ 사전교육')

    const assignment = buildProgressAssignmentSessionsFromRemote(
      {
        items: [
          { ...SCHEDULES_186486[0]!, assignmentEnabled: true, participants: [] },
          { ...preEducation, assignmentEnabled: false, participants: [] },
        ],
      },
      { program: scheduleSingleDateProgram() }
    )
    expect(assignment.map(session => session.id)).toEqual(['187543'])
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
      `2026.10.30(금) 09:30 ~ 11:30 ㅣ ${NAME}`,
      `2026.11.16(월) 09:30 ~ 11:30 ㅣ ${NAME}`,
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
