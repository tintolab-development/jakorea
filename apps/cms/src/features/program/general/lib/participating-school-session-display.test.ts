import { describe, expect, it } from 'vitest'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import {
  formatGeneralEducationScheduleLine,
  formatParticipatingSchoolSessionLine,
  formatVolunteerAssignmentScheduleLine,
  prepareGeneralEducationScheduleSessions,
  resolveParticipatingInstitutionScheduleRowLabel,
  resolveScheduleDetailTimeSpan,
} from './participating-school-session-display'
import type { Program } from '@/types/domain'

function baseProgram(overrides: Partial<Program> = {}): Program {
  return {
    id: 'prog-1',
    title: '테스트',
    type: 'offline',
    format: 'workshop',
    category: 'school',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    status: 'active',
    ...overrides,
  } as Program
}

function baseSession(overrides: Partial<ParticipatingSchoolSession> = {}): ParticipatingSchoolSession {
  return {
    round: 1,
    date: '2026.01.09',
    dayOfWeek: '금',
    duration: '2시간',
    format: '오프라인',
    classNum: '1교시',
    timeRange: '09:20~11:20',
    ...overrides,
  }
}

describe('formatGeneralEducationScheduleLine', () => {
  const dated = baseSession({
    date: '2026.04.21',
    dayOfWeek: '화',
    timeRange: '09:30~12:20',
    scheduleLabel: '2026.04.21(화) | 1지망',
  })

  it('커리큘럼·복수·날짜는 공통정보 시각과 차시를 붙인다', () => {
    expect(
      formatGeneralEducationScheduleLine(
        baseSession({ scheduleLabel: '26년 4월 20일(월) 09:30 ~ 12:20', round: 2 }),
        {
          educationStructure: 'curriculum',
          sessionRound: 'multi',
          educationScheduleMode: 'date',
          curriculumSessionLabels: ['1차시', '2차시'],
        }
      )
    ).toBe('2026.04.20(월) 09:30 ~ 12:20 | 2차시')
  })

  it('커리큘럼·복수·기간은 신청 시각과 희망 차시를 붙인다', () => {
    expect(
      formatGeneralEducationScheduleLine(
        baseSession({
          date: '2026.04.21',
          dayOfWeek: '화',
          classNum: '3차시',
          scheduleLabel: '2026.04.21(화) | 1지망',
        }),
        {
          educationStructure: 'curriculum',
          sessionRound: 'multi',
          educationScheduleMode: 'period',
        }
      )
    ).toBe('2026.04.21(화) 09:20 ~ 11:20 | 3차시')
  })

  it('커리큘럼·단일·기간은 신청 시각과 프로그램 차시를 붙인다', () => {
    expect(
      formatGeneralEducationScheduleLine(dated, {
        educationStructure: 'curriculum',
        sessionRound: 'single',
        educationScheduleMode: 'period',
        curriculumSessionCount: 3,
      })
    ).toBe('2026.04.21(화) 09:30 ~ 12:20 | 3차시')
  })

  it('커리큘럼·단일·날짜는 공통정보 시각과 차시를 붙인다', () => {
    expect(
      formatGeneralEducationScheduleLine(
        baseSession({ scheduleLabel: '26년 4월 20일(월) 09:30 ~ 12:20' }),
        {
          educationStructure: 'curriculum',
          sessionRound: 'single',
          educationScheduleMode: 'date',
          curriculumSessionCount: 3,
        }
      )
    ).toBe('2026.04.20(월) 09:30 ~ 12:20 | 3차시')
  })

  it('커리큘럼·단일·날짜는 sessionNo와 무관하게 모든 줄에 총 차시를 붙인다', () => {
    const shape = {
      educationStructure: 'curriculum' as const,
      sessionRound: 'single' as const,
      educationScheduleMode: 'date' as const,
      curriculumSessionCount: 2,
      curriculumSessionLabels: ['1차시', '2차시'],
    }
    // 참여자 API sessions[] 매핑 형태: round = sessionNo(일정 순번), classNum = N교시, duration = N분
    const first = baseSession({
      round: 1,
      date: '2026.11.11',
      dayOfWeek: '수',
      classNum: '1교시',
      duration: '120분',
      timeRange: '10:00 ~ 12:00',
    })
    const third = baseSession({
      round: 3,
      date: '2026.11.05',
      dayOfWeek: '목',
      classNum: '3교시',
      duration: '60분',
      timeRange: '18:57 ~ 19:57',
    })
    expect(formatGeneralEducationScheduleLine(first, shape)).toBe('2026.11.11(수) 10:00 ~ 12:00 | 2차시')
    expect(formatGeneralEducationScheduleLine(third, shape)).toBe('2026.11.05(목) 18:57 ~ 19:57 | 2차시')
    expect(
      formatGeneralEducationScheduleLine(baseSession({ round: 2, classNum: '1차시' }), shape)
    ).toBe('2026.01.09(금) 09:20 ~ 11:20 | 2차시')
  })

  it('커리큘럼·단일·날짜에서 차시가 1개면 일시만 보여 준다', () => {
    expect(
      formatGeneralEducationScheduleLine(baseSession({ round: 1 }), {
        educationStructure: 'curriculum',
        sessionRound: 'single',
        educationScheduleMode: 'date',
        curriculumSessionCount: 1,
        curriculumSessionLabels: ['1차시'],
      })
    ).toBe('2026.01.09(금) 09:20 ~ 11:20')
  })

  it('일정·복수는 일정별 날짜·시간만 보여 준다', () => {
    expect(
      formatGeneralEducationScheduleLine(
        baseSession({ scheduleLabel: '26년 11월 2일(월) 10:00 ~ 12:00 | 2회차' }),
        { educationStructure: 'schedule', sessionRound: 'multi', educationScheduleMode: 'date' }
      )
    ).toBe('2026.11.02(월) 10:00 ~ 12:00')
  })

  it('일정·단일·기간은 희망일에 세부 일정 첫 시작~마지막 종료를 붙인다', () => {
    const span = resolveScheduleDetailTimeSpan([
      { progressTimeSummary: '09:30 ~ 09:40' },
      { progressTimeSummary: '13:00 ~ 13:10' },
    ])
    expect(span).toBe('09:30 ~ 13:10')
    const line = formatGeneralEducationScheduleLine(dated, {
      educationStructure: 'schedule',
      sessionRound: 'single',
      educationScheduleMode: 'period',
    }, { detailScheduleTimeSpan: span })
    expect(line).toBe('2026.04.21(화) 09:30 ~ 13:10')
    expect(line.includes('지망')).toBe(false)
  })

  it('일정·단일·날짜는 공통정보 시각만 보여 준다', () => {
    expect(
      formatGeneralEducationScheduleLine(
        baseSession({ scheduleLabel: '26년 4월 20일(월) 09:30 ~ 12:20 | 1지망' }),
        { educationStructure: 'schedule', sessionRound: 'single', educationScheduleMode: 'date' }
      )
    ).toBe('2026.04.20(월) 09:30 ~ 12:20')
  })

  it('일정·복수라도 educationScheduleLines가 없으면 배정 세션만 유지한다', () => {
    const assigned = [dated]
    expect(
      prepareGeneralEducationScheduleSessions(assigned, {
        educationStructure: 'schedule',
        sessionRound: 'multi',
      })
    ).toEqual(assigned)
    expect(
      prepareGeneralEducationScheduleSessions([], {
        educationStructure: 'schedule',
        sessionRound: 'multi',
      })
    ).toEqual([])
  })

  it('일정·복수는 교육 진행 일정 줄을, 일정·단일·기간은 날짜당 한 줄을 쓴다', () => {
    expect(
      prepareGeneralEducationScheduleSessions([], {
        educationStructure: 'schedule',
        sessionRound: 'multi',
      }, {
        educationScheduleLines: ['26년 11월 2일(월) 10:00 ~ 12:00'],
      }).map(session => session.scheduleLabel)
    ).toEqual(['26년 11월 2일(월) 10:00 ~ 12:00'])

    const collapsed = prepareGeneralEducationScheduleSessions(
      [dated, { ...dated, round: 2 }],
      {
        educationStructure: 'schedule',
        sessionRound: 'single',
        educationScheduleMode: 'period',
      },
      { detailScheduleTimeSpan: '09:30 ~ 13:10' }
    )
    expect(collapsed).toHaveLength(1)
    expect(collapsed[0]?.scheduleLabel).toBeUndefined()
    expect(collapsed[0]?.timeRange).toBe('09:30 ~ 13:10')
  })
})

describe('formatParticipatingSchoolSessionLine', () => {
  it('scheduleLabel은 화면에서만 2026.10.26(월) 형식으로 바꾼다', () => {
    const session = baseSession({
      scheduleLabel: '26년 10월 26일(월) 10:00 ~ 12:00',
    })
    expect(formatParticipatingSchoolSessionLine(session)).toBe(
      '2026.10.26(월) 10:00 ~ 12:00 | 1회차'
    )
    expect(session.scheduleLabel).toBe('26년 10월 26일(월) 10:00 ~ 12:00')
  })
})

describe('resolveParticipatingInstitutionScheduleRowLabel', () => {
  it('단일 회차는 교육 일정을 노출한다', () => {
    const label = resolveParticipatingInstitutionScheduleRowLabel(
      baseProgram({
        generalProgramSessionRound: 'single',
        generalProgramEducationStructure: 'curriculum',
        generalCommonInfo: {
          curriculumSessions: [{ sessionLabel: '1차시', title: '1차시', description: '' }],
        },
      }),
      baseSession()
    )

    expect(label).toBe('교육 일정')
  })

  it('복수 커리큘럼형은 회차명(sessionLabel)을 노출한다', () => {
    const label = resolveParticipatingInstitutionScheduleRowLabel(
      baseProgram({
        generalProgramSessionRound: 'multi',
        generalProgramEducationStructure: 'curriculum',
        generalCommonInfo: {
          curriculumSessions: [
            { sessionLabel: '1회차', title: '1차시', description: '' },
            { sessionLabel: '2회차', title: '2차시', description: '' },
          ],
        },
      }),
      baseSession({ round: 2 })
    )

    expect(label).toBe('2회차')
  })

  it('복수 일정형은 일정명(name)을 노출한다', () => {
    const label = resolveParticipatingInstitutionScheduleRowLabel(
      baseProgram({
        generalProgramSessionRound: 'multi',
        generalProgramEducationStructure: 'schedule',
        generalCommonInfo: {
          scheduleDetails: [
            { scheduleLabel: '세부 일정 01', name: '오리엔테이션' },
            { scheduleLabel: '세부 일정 02', name: '국내대회' },
          ],
        },
      }),
      baseSession({ round: 1 })
    )

    expect(label).toBe('오리엔테이션')
  })

  it('복수 일정형 — 사전 교육 행은 회차 매칭에서 빼서 1회차에 사전 교육 이름이 붙지 않는다', () => {
    const program = baseProgram({
      generalProgramSessionRound: 'multi',
      generalProgramEducationStructure: 'schedule',
      generalCommonInfo: {
        scheduleDetails: [
          { scheduleLabel: '사전 교육', name: '사전 교육', blockKind: 'preEducation' },
          { scheduleLabel: '세부 일정 01', name: '오리엔테이션' },
          { scheduleLabel: '세부 일정 02', name: '국내대회' },
        ],
      },
    })

    expect(resolveParticipatingInstitutionScheduleRowLabel(program, baseSession({ round: 1 }))).toBe(
      '오리엔테이션'
    )
    expect(resolveParticipatingInstitutionScheduleRowLabel(program, baseSession({ round: 2 }))).toBe(
      '국내대회'
    )
  })

  it('복수 일정형 — 배정된 사전교육 행은 사전교육 라벨을 쓰고 이후 일정명은 밀리지 않는다', () => {
    const program = baseProgram({
      generalProgramSessionRound: 'multi',
      generalProgramEducationStructure: 'schedule',
      rounds: [
        { id: '187614', curriculum: '사전 교육' },
        { id: '187612', curriculum: '개인일정111' },
        { id: '187613', curriculum: '팀일정111' },
      ] as Program['rounds'],
      generalCommonInfo: {
        scheduleDetails: [
          { scheduleLabel: '사전 교육', name: '사전 교육', blockKind: 'preEducation' },
          { scheduleLabel: '행사 일정 01', name: '개인일정111' },
          { scheduleLabel: '행사 일정 02', name: '팀일정111' },
        ],
      },
    })

    expect(
      resolveParticipatingInstitutionScheduleRowLabel(
        program,
        baseSession({
          round: 1,
          resolvedScheduleId: 187614,
          scheduleRole: 'PRE_EDUCATION',
          educationSlotKey: 'general-pre-education:1',
        })
      )
    ).toBe('사전교육')
    expect(
      resolveParticipatingInstitutionScheduleRowLabel(
        program,
        baseSession({ round: 2, resolvedScheduleId: 187612, scheduleName: '개인일정111' })
      )
    ).toBe('개인일정111')
    expect(
      resolveParticipatingInstitutionScheduleRowLabel(
        program,
        baseSession({ round: 3, resolvedScheduleId: 187613, scheduleName: '팀일정111' })
      )
    ).toBe('팀일정111')
  })

  it('복수 일정형 — 사전교육이 없으면 기존처럼 1행이 첫 행사 일정명이다', () => {
    const program = baseProgram({
      generalProgramSessionRound: 'multi',
      generalProgramEducationStructure: 'schedule',
      rounds: [
        { id: '187612', curriculum: '개인일정111' },
        { id: '187613', curriculum: '팀일정111' },
      ] as Program['rounds'],
      generalCommonInfo: {
        scheduleDetails: [
          { scheduleLabel: '행사 일정 01', name: '개인일정111' },
          { scheduleLabel: '행사 일정 02', name: '팀일정111' },
        ],
      },
    })

    expect(
      resolveParticipatingInstitutionScheduleRowLabel(
        program,
        baseSession({ round: 1, resolvedScheduleId: 187612, scheduleName: '개인일정111' })
      )
    ).toBe('개인일정111')
    expect(
      resolveParticipatingInstitutionScheduleRowLabel(
        program,
        baseSession({ round: 2, resolvedScheduleId: 187613, scheduleName: '팀일정111' })
      )
    ).toBe('팀일정111')
  })

  it('복수 일정형 — 사전 교육 행 이름이 따로 입력돼 있어도 blockKind로 회차에서 뺀다', () => {
    const program = baseProgram({
      generalProgramSessionRound: 'multi',
      generalProgramEducationStructure: 'schedule',
      generalCommonInfo: {
        scheduleDetails: [
          { scheduleLabel: '세부 일정 01', name: '킥오프', blockKind: 'preEducation' },
          { scheduleLabel: '세부 일정 01', name: '오리엔테이션' },
        ],
      },
    })

    expect(resolveParticipatingInstitutionScheduleRowLabel(program, baseSession({ round: 1 }))).toBe(
      '오리엔테이션'
    )
  })

  it('복수 커리큘럼형 — 사전 교육 회차는 회차 매칭에서 뺀다', () => {
    const program = baseProgram({
      generalProgramSessionRound: 'multi',
      generalProgramEducationStructure: 'curriculum',
      generalCommonInfo: {
        curriculumSessions: [
          { sessionLabel: '사전 교육', title: '안내', description: '', isPreEducation: true },
          { sessionLabel: '1회차', title: '1차시', description: '' },
          { sessionLabel: '2회차', title: '2차시', description: '' },
        ],
      },
    })

    expect(resolveParticipatingInstitutionScheduleRowLabel(program, baseSession({ round: 1 }))).toBe(
      '1회차'
    )
    expect(resolveParticipatingInstitutionScheduleRowLabel(program, baseSession({ round: 2 }))).toBe(
      '2회차'
    )
  })
})

describe('formatVolunteerAssignmentScheduleLine', () => {
  it('UTC instant는 서울 시각과 회차로 표시한다', () => {
    const line = formatVolunteerAssignmentScheduleLine(
      baseSession({
        round: 1,
        date: '2026.11.06',
        dayOfWeek: '금',
        duration: '2차시',
        timeRange: '06:05~06:10',
        startAt: '2026-11-06T06:05:00Z',
        endAt: '2026-11-06T06:10:00Z',
      })
    )
    expect(line).toBe('2026.11.06(금) 15:05 ~ 15:10 | 1회차 (2차시)')
  })

  it('단일 회차는 날짜·시간만 노출한다', () => {
    const line = formatVolunteerAssignmentScheduleLine(
      baseSession(),
      baseProgram({
        generalProgramSessionRound: 'single',
        generalProgramEducationStructure: 'schedule',
      })
    )

    expect(line).toBe('2026.01.09(금) 09:20 ~ 11:20')
  })

  it('복수 커리큘럼형은 회차명을 노출한다', () => {
    const line = formatVolunteerAssignmentScheduleLine(
      baseSession({ round: 2 }),
      baseProgram({
        generalProgramSessionRound: 'multi',
        generalProgramEducationStructure: 'curriculum',
        generalCommonInfo: {
          curriculumSessions: [
            { sessionLabel: '1회차', title: '1차시', description: '' },
            { sessionLabel: '2회차', title: '2차시', description: '' },
          ],
        },
      })
    )

    expect(line).toBe('2026.01.09(금) 09:20 ~ 11:20 | 2회차 (2차시)')
  })

  it('복수 일정형은 일정명을 노출한다', () => {
    const line = formatVolunteerAssignmentScheduleLine(
      baseSession({ round: 1 }),
      baseProgram({
        generalProgramSessionRound: 'multi',
        generalProgramEducationStructure: 'schedule',
        generalCommonInfo: {
          scheduleDetails: [
            { scheduleLabel: '세부 일정 01', name: '오리엔테이션' },
            { scheduleLabel: '세부 일정 02', name: '국내대회' },
          ],
        },
      })
    )

    expect(line).toBe('2026.01.09(금) 09:20 ~ 11:20 | 오리엔테이션')
  })

  it('진행 시간이 없으면 날짜·회차만 노출한다', () => {
    const line = formatVolunteerAssignmentScheduleLine(
      baseSession({ timeRange: '', round: 1 }),
      baseProgram({
        generalProgramSessionRound: 'multi',
        generalProgramEducationStructure: 'curriculum',
        generalCommonInfo: {
          curriculumSessions: [
            { sessionLabel: '1회차', title: '1차시', description: '' },
            { sessionLabel: '2회차', title: '2차시', description: '' },
          ],
        },
      })
    )

    expect(line).toBe('2026.01.09(금) | 1회차 (1차시)')
  })
})
