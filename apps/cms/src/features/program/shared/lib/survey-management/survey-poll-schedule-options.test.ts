import { describe, expect, it } from 'vitest'
import {
  buildSurveyPollScheduleSelectOptions,
  buildSurveyPollScheduleSelectOptionsForProgram,
  collectSurveyPollUsedScheduleIds,
  collectUnboundSurveyPollScheduleValues,
  disableSurveyPollScheduleOptionsWithSurvey,
  isSurveyPollBindingTargetScheduleAlreadyRegistered,
  SURVEY_POLL_SCHEDULE_ALREADY_REGISTERED_MESSAGE,
  formatSurveyPollScheduleOptionLabel,
  pickLastSurveyPollEducationSlot,
  isTrainedTeacherEventScheduleProgram,
  resolveSurveyPollScheduleCandidatesFromSources,
  sortSatisfactionScheduleDisplayItemsAsc,
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

  it('picks the last education slot by start then session', () => {
    expect(
      pickLastSurveyPollEducationSlot([
        slot({
          id: 10,
          sessionNo: 1,
          startAt: '2026-11-12T03:00:00.000Z',
          endAt: '2026-11-12T06:00:00.000Z',
        }),
        slot({
          id: 30,
          sessionNo: 3,
          startAt: '2026-11-26T03:00:00.000Z',
          endAt: '2026-11-26T06:00:00.000Z',
        }),
        slot({
          id: 20,
          sessionNo: 2,
          startAt: '2026-11-19T03:00:00.000Z',
          endAt: '2026-11-19T06:00:00.000Z',
        }),
        slot({
          id: 99,
          sessionNo: 9,
          scheduleRole: 'PRE_EDUCATION',
          startAt: '2026-12-01T03:00:00.000Z',
        }),
      ])?.id
    ).toBe(30)
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
    expect(options[0]?.label).toBe('2026.03.01(일) 10:00 ~ 12:00')
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
    expect(options[0]?.label).toBe('2026.04.03(금) 09:30 ~ 12:20')
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
    expect(options[0]?.label).toBe('2026.04.03(금) 09:30 ~ 12:20 | 1회차')
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
    expect(label).toBe('2026.03.01(일) 10:00 ~ 12:00')
    expect(label).not.toContain('본 교육')
  })
})

describe('survey schedule option round suffix (GENERAL only)', () => {
  const slots = [
    slot({ id: 31, sessionNo: 3, startAt: '2026-10-27T03:50:00+09:00', endAt: '2026-10-27T03:55:00+09:00' }),
    slot({ id: 32, sessionNo: 7, startAt: '2026-10-28T04:00:00+09:00', endAt: '2026-10-28T05:00:00+09:00' }),
  ]

  it.each(['GENERAL', 'GENERAL_ORGANIZATION', 'GENERAL_INDIVIDUAL'])(
    '%s uses stored sessionNo, not list order',
    backendProgramType => {
      const options = buildSurveyPollScheduleSelectOptionsForProgram(
        baseProgram({ backendProgramType }),
        slots
      )
      expect(options).toEqual([
        { value: '31', label: '2026.10.27(화) 03:50 ~ 03:55 | 3회차' },
        { value: '32', label: '2026.10.28(수) 04:00 ~ 05:00 | 7회차' },
      ])
    }
  )

  it('GENERAL without sessionNo shows date only (no list-index fallback)', () => {
    const options = buildSurveyPollScheduleSelectOptionsForProgram(
      baseProgram({ backendProgramType: 'GENERAL_ORGANIZATION' }),
      [
        slot({ id: 41, startAt: '2026-10-27T03:50:00+09:00', endAt: '2026-10-27T03:55:00+09:00' }),
        slot({ id: 42, sessionNo: null as unknown as number, startAt: '2026-10-28T04:00:00+09:00', endAt: '2026-10-28T05:00:00+09:00' }),
      ]
    )
    expect(options).toEqual([
      { value: '41', label: '2026.10.27(화) 03:50 ~ 03:55' },
      { value: '42', label: '2026.10.28(수) 04:00 ~ 05:00' },
    ])
  })

  it.each(['UJAT', 'UJAT_DGBONG', 'COMPANY_SCHOOL', 'GEMINI', undefined])(
    '%s stays unchanged',
    backendProgramType => {
      const options = buildSurveyPollScheduleSelectOptionsForProgram(
        baseProgram({ backendProgramType }),
        slots
      )
      expect(options.map(o => o.label)).toEqual([
        '2026.10.27(화) 03:50 ~ 03:55',
        '2026.10.28(수) 04:00 ~ 05:00',
      ])
    }
  )

  it('TT (GENERAL-based schedule multi) stays unchanged, incl. event-name labels', () => {
    const program = baseProgram({
      backendProgramType: 'TRAINED_TEACHER',
      generalProgramSessionRound: 'multi',
      generalProgramEducationStructure: 'schedule',
      generalCommonInfo: {
        scheduleDetails: [
          {
            scheduleLabel: '행사 일정 01',
            name: '행사 A',
            scheduleDateLabel: '26년 10월 27일(화) 3:50 ~ 3:55',
          },
        ],
      },
    })
    const options = buildSurveyPollScheduleSelectOptionsForProgram(program, slots)
    expect(options).toEqual([
      { value: '31', label: '행사 A' },
      { value: '32', label: '2026.10.28(수) 04:00 ~ 05:00' },
    ])
  })

  it('TT without schedule-multi shape also has no suffix', () => {
    const options = buildSurveyPollScheduleSelectOptionsForProgram(
      baseProgram({ backendProgramType: 'TRAINED_TEACHER' }),
      slots
    )
    expect(options.every(o => !o.label.includes('회차'))).toBe(true)
  })

  it('does not change the raw label formatter or option values', () => {
    const options = buildSurveyPollScheduleSelectOptions(slots)
    expect(options.map(o => o.value)).toEqual(['31', '32'])
    expect(options[0]?.label).toBe('2026.10.27(화) 03:50 ~ 03:55')
  })
})

describe('one survey per schedule — disable used schedules', () => {
  const slots = [
    slot({ id: 31, sessionNo: 1, startAt: '2026-10-27T03:50:00+09:00', endAt: '2026-10-27T03:55:00+09:00' }),
    slot({ id: 32, sessionNo: 2, startAt: '2026-10-28T04:00:00+09:00', endAt: '2026-10-28T05:00:00+09:00' }),
    slot({ id: 33, sessionNo: 3, startAt: '2026-10-29T04:00:00+09:00', endAt: '2026-10-29T05:00:00+09:00' }),
  ]
  const ref = (
    binding: Partial<{
      formType: string
      targetRole: string
      targetScope: string
      targetScopeId: number
      active: boolean
    }>
  ) => ({ binding: { formType: 'SURVEY', targetScope: 'SCHEDULE', active: true, ...binding } })

  it('collects only active SURVEY+SCHEDULE binding scheduleIds', () => {
    const used = collectSurveyPollUsedScheduleIds([
      ref({ targetScopeId: 31 }),
      ref({ targetScopeId: 32, active: false }),
      ref({ targetScopeId: 33, formType: 'SATISFACTION' }),
      ref({ targetScopeId: 34, targetScope: 'PROGRAM' }),
      ref({ targetScopeId: undefined }),
      ref({ targetScopeId: 35, targetScope: ' schedule ', formType: 'survey' }),
    ])
    expect([...used].sort()).toEqual(['31', '35'])
    expect(collectSurveyPollUsedScheduleIds(null).size).toBe(0)
  })

  it('filters SATISFACTION by formType and targetRole', () => {
    const used = collectSurveyPollUsedScheduleIds(
      [
        ref({ targetScopeId: 31, formType: 'SATISFACTION', targetRole: 'TEACHER' }),
        ref({ targetScopeId: 32, formType: 'SATISFACTION', targetRole: 'VOLUNTEER_H1' }),
        ref({ targetScopeId: 33, formType: 'SURVEY' }),
      ],
      { formType: 'SATISFACTION', targetRole: 'TEACHER' }
    )
    expect([...used]).toEqual(['31'])
  })

  it('keeps used schedules visible but disabled, labels and values unchanged', () => {
    const base = buildSurveyPollScheduleSelectOptionsForProgram(
      baseProgram({ backendProgramType: 'GENERAL_ORGANIZATION' }),
      slots
    )
    const options = disableSurveyPollScheduleOptionsWithSurvey(base, [ref({ targetScopeId: 32 })])
    expect(options).toHaveLength(3)
    expect(options.map(o => o.value)).toEqual(['31', '32', '33'])
    expect(options.map(o => o.label)).toEqual(base.map(o => o.label))
    expect(options.map(o => o.disabled === true)).toEqual([false, true, false])
    expect(options[0]).not.toHaveProperty('disabled')
    expect(options[1]?.label).toBe('2026.10.28(수) 04:00 ~ 05:00 | 2회차')
  })

  it('without bindings nothing is disabled (no mock/stale data)', () => {
    const base = buildSurveyPollScheduleSelectOptions(slots)
    expect(disableSurveyPollScheduleOptionsWithSurvey(base, null)).toEqual(base)
    expect(disableSurveyPollScheduleOptionsWithSurvey(base, [])).toEqual(base)
  })

  it.each(['GENERAL_ORGANIZATION', 'UJAT', 'TRAINED_TEACHER'])(
    '%s: used schedule disabled, TT/UJAT labels unchanged',
    backendProgramType => {
      const base = buildSurveyPollScheduleSelectOptionsForProgram(
        baseProgram({ backendProgramType }),
        slots
      )
      const options = disableSurveyPollScheduleOptionsWithSurvey(base, [
        ref({ targetScopeId: 31 }),
        ref({ targetScopeId: 33 }),
      ])
      expect(options.map(o => o.disabled === true)).toEqual([true, false, true])
      if (backendProgramType !== 'GENERAL_ORGANIZATION') {
        expect(options.every(o => !o.label.includes('회차'))).toBe(true)
      }
    }
  )

  it('all schedules used → every option disabled', () => {
    const base = buildSurveyPollScheduleSelectOptions(slots)
    const options = disableSurveyPollScheduleOptionsWithSurvey(
      base,
      [31, 32, 33].map(id => ref({ targetScopeId: id }))
    )
    expect(options.every(o => o.disabled === true)).toBe(true)
  })

  it('collects unbound schedule values for per-schedule auto mapping', () => {
    const base = buildSurveyPollScheduleSelectOptions(slots)
    const options = disableSurveyPollScheduleOptionsWithSurvey(base, [ref({ targetScopeId: 32 })])
    expect(collectUnboundSurveyPollScheduleValues(options)).toEqual(['31', '33'])
    expect(
      collectUnboundSurveyPollScheduleValues(
        disableSurveyPollScheduleOptionsWithSurvey(
          base,
          [31, 32, 33].map(id => ref({ targetScopeId: id }))
        )
      )
    ).toEqual([])
  })
})

describe('hidden schedule field — already registered guard', () => {
  const ref = (targetScopeId: number, extra: Record<string, unknown> = {}) => ({
    binding: { formType: 'SURVEY', targetScope: 'SCHEDULE', active: true, targetScopeId, ...extra },
  })

  it('uses the exact message', () => {
    expect(SURVEY_POLL_SCHEDULE_ALREADY_REGISTERED_MESSAGE).toBe('이미 설문이 등록된 일정입니다.')
  })

  it('blocks when the auto-bound schedule already has an active survey', () => {
    expect(
      isSurveyPollBindingTargetScheduleAlreadyRegistered(
        { targetScope: 'SCHEDULE', targetScopeId: 100 },
        [ref(100)]
      )
    ).toBe(true)
  })

  it('does not block other schedules, inactive bindings or non-survey bindings', () => {
    const target = { targetScope: 'SCHEDULE', targetScopeId: 100 }
    expect(isSurveyPollBindingTargetScheduleAlreadyRegistered(target, [ref(101)])).toBe(false)
    expect(isSurveyPollBindingTargetScheduleAlreadyRegistered(target, [ref(100, { active: false })])).toBe(false)
    expect(isSurveyPollBindingTargetScheduleAlreadyRegistered(target, [ref(100, { formType: 'SATISFACTION' })])).toBe(false)
    expect(isSurveyPollBindingTargetScheduleAlreadyRegistered(target, null)).toBe(false)
  })

  it('never blocks PROGRAM scope (period programs) or a missing target', () => {
    expect(
      isSurveyPollBindingTargetScheduleAlreadyRegistered({ targetScope: 'PROGRAM' }, [ref(100)])
    ).toBe(false)
    expect(
      isSurveyPollBindingTargetScheduleAlreadyRegistered(
        { targetScope: 'PROGRAM', targetScopeId: 100 },
        [ref(100)]
      )
    ).toBe(false)
    expect(isSurveyPollBindingTargetScheduleAlreadyRegistered(null, [ref(100)])).toBe(false)
  })
})

describe('sortSatisfactionScheduleDisplayItemsAsc', () => {
  it('puts earlier dates and lower session numbers first', () => {
    expect(
      sortSatisfactionScheduleDisplayItemsAsc([
        { key: '1', sessionNo: 1, startAt: '2026-11-03T00:00:00+09:00' },
        { key: '2', sessionNo: 2, startAt: '2026-11-04T00:00:00+09:00' },
        { key: '3', sessionNo: 3, startAt: '2026-11-25T00:00:00+09:00' },
      ]).map(item => item.key)
    ).toEqual(['1', '2', '3'])
  })

  it('orders same-day sessions by session number', () => {
    expect(
      sortSatisfactionScheduleDisplayItemsAsc([
        { key: '2', sessionNo: 2, startAt: '2026-11-09T00:00:00+09:00' },
        { key: '1', sessionNo: 1, startAt: '2026-11-09T00:00:00+09:00' },
      ]).map(item => item.key)
    ).toEqual(['1', '2'])
  })
})
