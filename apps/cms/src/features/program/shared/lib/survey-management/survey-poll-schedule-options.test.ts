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
})

describe('buildSurveyPollScheduleSelectOptionsForProgram', () => {
  it('uses education schedule lines for single-round program progress', () => {
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
        label: '26년 9월 16일(수) 9:22 ~ 10:22',
      },
    ])
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
      '26년 4월 3일(금) 9:30 ~ 12:20',
      '26년 4월 10일(금) 13:00 ~ 15:50',
    ])
    expect(options.map(o => o.value)).toEqual(['20', '30'])
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
