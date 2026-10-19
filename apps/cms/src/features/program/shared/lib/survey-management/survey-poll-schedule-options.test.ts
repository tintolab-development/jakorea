import { describe, expect, it } from 'vitest'
import {
  buildSurveyPollScheduleSelectOptions,
  buildSurveyPollScheduleSelectOptionsForProgram,
  formatSurveyPollScheduleOptionLabel,
  isTrainedTeacherEventScheduleProgram,
  resolveSurveyPollScheduleCandidatesFromSources,
} from '@/features/program/shared/lib/survey-management/survey-poll-schedule-options'
import type { Program } from '@/types/domain'
import type { ProgramScheduleResponse } from '@/shared/api/generated/dashboard/schemas/programScheduleResponse'

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

function slot(
  overrides: Partial<ProgramScheduleResponse> & { id: number }
): ProgramScheduleResponse {
  return {
    scheduleOrigin: 'PROGRAM_DEFINED',
    scheduleRole: 'EDUCATION',
    scheduleStatus: 'ACTIVE',
    allDay: false,
    ...overrides,
  }
}

describe('buildSurveyPollScheduleSelectOptions', () => {
  it('sorts by startAt and uses real scheduleId as value', () => {
    const options = buildSurveyPollScheduleSelectOptions([
      slot({
        id: 30,
        sessionNo: 2,
        startAt: '2026-04-10T04:00:00Z',
        endAt: '2026-04-10T06:00:00Z',
      }),
      slot({
        id: 10,
        sessionNo: 1,
        startAt: '2026-04-03T00:30:00Z',
        endAt: '2026-04-03T03:20:00Z',
      }),
    ])
    expect(options.map(o => o.value)).toEqual(['10', '30'])
  })

  it('drops schedules without positive scheduleId', () => {
    const options = buildSurveyPollScheduleSelectOptions([
      {
        scheduleOrigin: 'PROGRAM_DEFINED',
        scheduleRole: 'EDUCATION',
        scheduleStatus: 'ACTIVE',
        sessionNo: 1,
        scheduleName: '무 id',
      },
      slot({ id: 5, sessionNo: 1, scheduleName: '유효' }),
    ])
    expect(options.map(o => o.value)).toEqual(['5'])
  })

  it('formats API schedule as common-info education line', () => {
    const options = buildSurveyPollScheduleSelectOptions([
      slot({
        id: 5,
        sessionNo: 1,
        startAt: '2026-03-01T10:00:00+09:00',
        endAt: '2026-03-01T12:00:00+09:00',
      }),
    ])
    expect(options[0]?.label).toBe('26년 3월 1일(일) 10:00 ~ 12:00')
  })

  it('keeps only PROGRAM_DEFINED EDUCATION/SESSION ACTIVE candidates', () => {
    const options = buildSurveyPollScheduleSelectOptions([
      slot({ id: 1, sessionNo: 1 }),
      slot({ id: 2, sessionNo: 2, scheduleRole: 'PRE_EDUCATION' }),
      slot({ id: 3, sessionNo: 3, scheduleStatus: 'INACTIVE' }),
      slot({ id: 4, sessionNo: 4, scheduleOrigin: 'APPLICATION_MATERIALIZED' }),
      slot({ id: 5, sessionNo: 5, scheduleOrigin: 'UNKNOWN' }),
      slot({ id: 6, sessionNo: 6, scheduleRole: 'SESSION' }),
    ])
    expect(options.map(option => option.value)).toEqual(['1', '6'])
  })

  it('drops period windows that are not selectable class dates', () => {
    const options = buildSurveyPollScheduleSelectOptions([
      slot({
        id: 10,
        allDay: true,
        startAt: '2026-11-04T15:00:00Z',
        endAt: '2026-11-13T15:00:00Z',
      }),
      slot({
        id: 187129,
        sessionNo: 1,
        allDay: true,
        startAt: '2026-11-06T15:00:00Z',
        endAt: '2026-12-27T15:00:00Z',
        scheduleRole: null as unknown as string,
      }),
      slot({
        id: 11,
        sessionNo: 1,
        startAt: '2026-11-09T01:00:00Z',
        endAt: '2026-11-09T03:00:00Z',
      }),
    ])
    expect(options.map(option => option.value)).toEqual(['11'])
  })

  it('shows three education-slots as three survey options', () => {
    const options = buildSurveyPollScheduleSelectOptions([
      slot({
        id: 187201,
        startAt: '2026-10-21T09:38:00Z',
        endAt: '2026-10-21T10:38:00Z',
        educationSlotKey: 'general-common-line:3',
      }),
      slot({
        id: 187202,
        startAt: '2026-11-02T01:00:00Z',
        endAt: '2026-11-02T03:00:00Z',
        educationSlotKey: 'general-common-line:1',
      }),
      slot({
        id: 187203,
        startAt: '2026-11-09T04:30:00Z',
        endAt: '2026-11-09T07:00:00Z',
        educationSlotKey: 'general-common-line:2',
      }),
    ])
    expect(options).toHaveLength(3)
    expect(options.map(o => o.value)).toEqual(['187201', '187202', '187203'])
  })
})

describe('buildSurveyPollScheduleSelectOptionsForProgram', () => {
  it('uses education-slots directly instead of common-info line mapping', () => {
    const program = baseProgram({
      generalProgramSessionRound: 'single',
      generalProgramEducationStructure: 'schedule',
      generalCommonInfo: {
        educationScheduleLines: ['26년 9월 16일(수) 9:22 ~ 10:22'],
      },
    })
    const options = buildSurveyPollScheduleSelectOptionsForProgram(program, [
      slot({ id: 100, sessionNo: 1, scheduleName: '프로그램 진행' }),
    ])
    expect(options).toEqual([
      {
        value: '100',
        label: '프로그램 진행',
      },
    ])
  })

  it('matches TT event names by scheduleDateLabel datetime, not array index', () => {
    const program = baseProgram({
      backendProgramType: 'TRAINED_TEACHER',
      generalProgramSessionRound: 'multi',
      generalProgramEducationStructure: 'schedule',
      generalCommonInfo: {
        scheduleDetails: [
          {
            scheduleLabel: '세부 일정 01',
            name: '필요와 욕구, 현명한 소비',
            scheduleDateLabel: '26년 11월 2일(월) 10:00 ~ 12:00',
          },
          {
            scheduleLabel: '세부 일정 02',
            name: '저축 목표 세우기 A',
            scheduleDateLabel: '26년 11월 9일(월) 13:30 ~ 16:00',
          },
          {
            scheduleLabel: '세부 일정 03',
            name: '저축 목표 세우기 B',
            scheduleDateLabel: '26년 10월 21일(수) 18:38 ~ 19:38',
          },
        ],
      },
    })
    // API starts sorted differently from scheduleDetails order
    const options = buildSurveyPollScheduleSelectOptionsForProgram(program, [
      slot({
        id: 187203,
        startAt: '2026-11-09T13:30:00+09:00',
        endAt: '2026-11-09T16:00:00+09:00',
      }),
      slot({
        id: 187201,
        startAt: '2026-10-21T18:38:00+09:00',
        endAt: '2026-10-21T19:38:00+09:00',
      }),
      slot({
        id: 187202,
        startAt: '2026-11-02T10:00:00+09:00',
        endAt: '2026-11-02T12:00:00+09:00',
      }),
    ])
    expect(options.map(o => ({ value: o.value, label: o.label }))).toEqual([
      { value: '187201', label: '저축 목표 세우기 B' },
      { value: '187202', label: '필요와 욕구, 현명한 소비' },
      { value: '187203', label: '저축 목표 세우기 A' },
    ])
  })

  it('falls back to datetime label when scheduleDateLabel does not match', () => {
    const program = baseProgram({
      backendProgramType: 'TRAINED_TEACHER',
      generalProgramSessionRound: 'multi',
      generalProgramEducationStructure: 'schedule',
      generalCommonInfo: {
        scheduleDetails: [
          {
            scheduleLabel: '행사 일정 01',
            name: '다른 날 행사',
            scheduleDateLabel: '26년 5월 1일(금) 10:00 ~ 12:00',
          },
        ],
      },
    })
    const options = buildSurveyPollScheduleSelectOptionsForProgram(program, [
      slot({
        id: 10,
        startAt: '2026-04-03T09:30:00+09:00',
        endAt: '2026-04-03T12:20:00+09:00',
      }),
    ])
    expect(options[0]?.value).toBe('10')
    expect(options[0]?.label).toBe('26년 4월 3일(금) 9:30 ~ 12:20')
  })

  it('does not overwrite non-trained-teacher labels with scheduleDetails', () => {
    const program = baseProgram({
      backendProgramType: 'GENERAL_ORGANIZATION',
      generalProgramSessionRound: 'multi',
      generalProgramEducationStructure: 'schedule',
      generalCommonInfo: {
        scheduleDetails: [
          {
            scheduleLabel: '행사 일정 01',
            name: '공통정보 행사명',
            scheduleDateLabel: '26년 4월 3일(금) 9:30 ~ 12:20',
          },
        ],
      },
    })
    const options = buildSurveyPollScheduleSelectOptionsForProgram(program, [
      slot({
        id: 10,
        sessionNo: 1,
        scheduleName: '서버 일정명',
        startAt: '2026-04-03T09:30:00+09:00',
        endAt: '2026-04-03T12:20:00+09:00',
      }),
    ])
    expect(options[0]?.label).toBe('26년 4월 3일(금) 9:30 ~ 12:20')
  })

  it('does not invent options from scheduleDetails when education-slots are empty', () => {
    const program = baseProgram({
      backendProgramType: 'TRAINED_TEACHER',
      generalProgramSessionRound: 'multi',
      generalProgramEducationStructure: 'schedule',
      generalCommonInfo: {
        scheduleDetails: [
          {
            scheduleLabel: '세부 일정 01',
            name: '필요와 욕구, 현명한 소비',
            scheduleDateLabel: '26년 11월 2일(월) 10:00 ~ 12:00',
          },
        ],
      },
    })
    expect(buildSurveyPollScheduleSelectOptionsForProgram(program, [])).toEqual([])
  })

  it('keeps empty options when physical ids are missing', () => {
    const options = buildSurveyPollScheduleSelectOptionsForProgram(
      baseProgram({
        backendProgramType: 'TRAINED_TEACHER',
        generalProgramEducationStructure: 'schedule',
        generalProgramSessionRound: 'multi',
      }),
      [
        {
          sessionNo: 1,
          scheduleName: '행사',
          scheduleOrigin: 'PROGRAM_DEFINED',
          scheduleRole: 'EDUCATION',
          scheduleStatus: 'ACTIVE',
        },
      ]
    )
    expect(options).toEqual([])
  })
})

describe('isTrainedTeacherEventScheduleProgram', () => {
  it('only enables event label matching for trained-teacher schedule multi programs', () => {
    expect(
      isTrainedTeacherEventScheduleProgram(
        baseProgram({
          backendProgramType: 'TRAINED_TEACHER',
          generalProgramEducationStructure: 'schedule',
          generalProgramSessionRound: 'multi',
        })
      )
    ).toBe(true)
    expect(
      isTrainedTeacherEventScheduleProgram(
        baseProgram({
          backendProgramType: 'GENERAL_ORGANIZATION',
          generalProgramEducationStructure: 'schedule',
          generalProgramSessionRound: 'multi',
        })
      )
    ).toBe(false)
  })
})

describe('resolveSurveyPollScheduleCandidatesFromSources', () => {
  it('uses education-slots only and ignores /schedules physical fallback', () => {
    const candidates = resolveSurveyPollScheduleCandidatesFromSources({
      educationSlots: [],
      physicalSchedules: [
        slot({
          id: 21,
          sessionNo: 1,
          scheduleName: '오리엔테이션',
        }),
        slot({
          id: 187129,
          sessionNo: 1,
          allDay: true,
          startAt: '2026-11-06T15:00:00Z',
          endAt: '2026-12-27T15:00:00Z',
        }),
      ],
    })
    expect(candidates).toEqual([])
  })

  it('filters education-slots candidates and ignores physical schedules when slots exist', () => {
    const candidates = resolveSurveyPollScheduleCandidatesFromSources({
      educationSlots: [
        slot({ id: 11, sessionNo: 1 }),
        slot({
          id: 12,
          sessionNo: 2,
          scheduleOrigin: 'APPLICATION_MATERIALIZED',
        }),
      ],
      physicalSchedules: [slot({ id: 21, sessionNo: 1 })],
    })
    expect(candidates.map(row => row.id)).toEqual([11])
  })
})

describe('formatSurveyPollScheduleOptionLabel', () => {
  it('uses common-info datetime format without schedule name', () => {
    const label = formatSurveyPollScheduleOptionLabel(
      {
        scheduleName: '본 교육',
        sessionNo: 1,
        startAt: '2026-03-01T10:00:00+09:00',
        endAt: '2026-03-01T12:00:00+09:00',
      },
      0
    )
    expect(label).toBe('26년 3월 1일(일) 10:00 ~ 12:00')
    expect(label).not.toContain('본 교육')
  })
})
