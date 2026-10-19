import { describe, expect, it } from 'vitest'
import {
  buildSurveyPollScheduleSelectOptions,
  buildSurveyPollScheduleSelectOptionsForProgram,
  formatSurveyPollScheduleOptionLabel,
} from '@/features/program/shared/lib/survey-management/survey-poll-schedule-options'
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

describe('buildSurveyPollScheduleSelectOptions', () => {
  it('sorts sessions by sessionNo without 전체 option', () => {
    const options = buildSurveyPollScheduleSelectOptions([
      { id: 30, sessionNo: 2, scheduleName: '2회차' },
      { id: 10, sessionNo: 1, scheduleName: '1회차' },
    ])
    expect(options).toHaveLength(2)
    expect(options[0]?.value).toBe('10')
    expect(options[1]?.value).toBe('30')
  })

  it('drops schedules without id', () => {
    const options = buildSurveyPollScheduleSelectOptions([
      { sessionNo: 1, scheduleName: '무 id' },
      { id: 5, sessionNo: 1, scheduleName: '유효' },
    ])
    expect(options).toHaveLength(1)
    expect(options[0]?.value).toBe('5')
  })

  it('formats API schedule as common-info education line', () => {
    const options = buildSurveyPollScheduleSelectOptions([
      {
        id: 5,
        sessionNo: 1,
        startAt: '2026-03-01T10:00:00+09:00',
        endAt: '2026-03-01T12:00:00+09:00',
      },
    ])
    expect(options[0]?.label).toBe('26년 3월 1일(일) 10:00 ~ 12:00')
  })

  it('keeps only education/session ACTIVE candidates passed from education-slots', () => {
    const options = buildSurveyPollScheduleSelectOptions([
      { id: 1, sessionNo: 1, scheduleRole: 'EDUCATION', scheduleStatus: 'ACTIVE' },
      { id: 2, sessionNo: 2, scheduleRole: 'PRE_EDUCATION', scheduleStatus: 'ACTIVE' },
      { id: 3, sessionNo: 3, scheduleRole: 'EDUCATION', scheduleStatus: 'INACTIVE' },
    ])
    expect(options.map(option => option.value)).toEqual(['1'])
  })

  it('drops period windows that are not selectable class dates', () => {
    const options = buildSurveyPollScheduleSelectOptions([
      {
        id: 10,
        scheduleRole: 'EDUCATION',
        scheduleStatus: 'ACTIVE',
        allDay: true,
        startAt: '2026-11-04T15:00:00Z',
        endAt: '2026-11-13T15:00:00Z',
      },
      {
        id: 11,
        sessionNo: 1,
        scheduleRole: 'EDUCATION',
        scheduleStatus: 'ACTIVE',
        startAt: '2026-11-09T01:00:00Z',
        endAt: '2026-11-09T03:00:00Z',
      },
    ])
    expect(options.map(option => option.value)).toEqual(['11'])
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
      { id: 100, sessionNo: 1, scheduleName: '프로그램 진행' },
    ])
    expect(options).toEqual([
      {
        value: '100',
        label: '프로그램 진행',
      },
    ])
  })

  it('does not collapse multi-slot education-slots into program_progress mapping', () => {
    const program = baseProgram({
      generalProgramSessionRound: 'single',
      generalProgramEducationStructure: 'schedule',
      generalCommonInfo: {
        educationScheduleLines: [
          '26년 10월 30일(금) 13:30 ~ 15:30',
          '26년 10월 30일(금) 9:30 ~ 11:30',
        ],
      },
    })
    const options = buildSurveyPollScheduleSelectOptionsForProgram(program, [
      { id: 186892, sessionNo: 1, allDay: true, startAt: '2026-10-30T00:00:00+09:00', endAt: '2026-10-30T23:59:00+09:00' },
      { id: 186896, sessionNo: 4, startAt: '2026-10-30T13:30:00+09:00', endAt: '2026-10-30T15:30:00+09:00' },
      { id: 186897, sessionNo: 5, startAt: '2026-10-30T09:30:00+09:00', endAt: '2026-10-30T11:30:00+09:00' },
    ])
    expect(options).toHaveLength(3)
    expect(options.map(o => o.value)).toEqual(['186892', '186896', '186897'])
  })

  it('uses all ACTIVE education-slots for single-round multi-slot API rows', () => {
    const program = baseProgram({
      generalProgramAudience: 'organization',
      generalProgramSessionRound: 'single',
      generalProgramEducationStructure: 'schedule',
      generalCommonInfo: {
        educationScheduleLines: ['26년 11월 13일(금) 10:00 ~ 12:00'],
      },
    })
    const apiSchedules = [
      { id: 186903, sessionNo: 1, scheduleRole: 'EDUCATION', scheduleStatus: 'ACTIVE', startAt: '2026-11-12T15:00:00Z', endAt: '2026-12-24T15:00:00Z', allDay: true },
      { id: 186904, sessionNo: 2, scheduleRole: 'EDUCATION', scheduleStatus: 'ACTIVE', startAt: '2026-11-01T15:00:00Z', endAt: '2026-11-02T15:00:00Z', allDay: true },
      { id: 186909, sessionNo: 7, scheduleRole: 'EDUCATION', scheduleStatus: 'ACTIVE', startAt: '2026-11-02T00:30:00Z', endAt: '2026-11-02T02:30:00Z', allDay: false },
    ]
    const options = buildSurveyPollScheduleSelectOptionsForProgram(program, apiSchedules)
    expect(options).toHaveLength(3)
    expect(options.map(o => o.value)).toEqual(['186903', '186904', '186909'])
  })

  it('zips education schedule lines for schedule multi event rows only', () => {
    const program = baseProgram({
      generalProgramAudience: 'individual',
      generalProgramSessionRound: 'multi',
      generalProgramEducationStructure: 'schedule',
      generalCommonInfo: {
        educationScheduleLines: [
          '26년 4월 3일(금) 9:30 ~ 12:20',
          '26년 4월 10일(금) 13:00 ~ 15:50',
        ],
        scheduleDetails: [
          { scheduleLabel: '세부 일정 01', name: '오리엔테이션' },
          { scheduleLabel: '행사 일정 01', name: '국내대회' },
          { scheduleLabel: '행사 일정 02', name: '해외대회' },
        ],
      },
    })
    const options = buildSurveyPollScheduleSelectOptionsForProgram(program, [
      { id: 10, sessionNo: 1, scheduleName: '오리엔테이션' },
      { id: 20, sessionNo: 2, scheduleName: '국내대회' },
      { id: 30, sessionNo: 3, scheduleName: '해외대회' },
    ])
    expect(options.map(o => o.label)).toEqual([
      '오리엔테이션',
      '국내대회',
      '해외대회',
    ])
    expect(options.map(o => o.value)).toEqual(['10', '20', '30'])
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
