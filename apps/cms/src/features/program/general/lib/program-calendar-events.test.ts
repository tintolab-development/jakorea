import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import { buildGeneralProgramCalendarEvents } from './program-calendar-events'

function createProgram(overrides: Partial<Program> = {}): Program {
  return {
    id: 'program-1',
    sponsorId: 'sponsor-1',
    title: '테스트 프로그램',
    type: 'offline',
    format: 'course',
    category: 'school',
    rounds: [],
    startDate: '2026-04-03T00:00:00+09:00',
    endDate: '2026-11-20T23:59:59+09:00',
    applicationStartDate: '2026-01-05T00:00:00+09:00',
    applicationEndDate: '2026-01-28T23:59:59+09:00',
    status: 'active',
    lifecycleStatus: 'education_in_progress',
    generalProgramEducationStructure: 'curriculum',
    generalProgramSessionRound: 'multi',
    generalCommonInfo: {
      educationScheduleLines: [
        '26년 4월 20일(월) 09:30 ~ 12:20',
        '26년 4월 27일(월) 13:00 ~ 15:50',
      ],
      calendarSurveySchedules: [
        {
          id: 'survey-start',
          title: '설문조사 시작',
          startDate: '2026-04-03T00:00:00+09:00',
        },
      ],
      calendarAssignmentSchedules: [
        {
          id: 'assignment-due',
          title: '과제 제출 마감',
          dueDate: '2026-04-27T23:59:59+09:00',
        },
      ],
    },
    createdAt: '2026-01-01T00:00:00+09:00',
    updatedAt: '2026-01-01T00:00:00+09:00',
    ...overrides,
  }
}

describe('buildGeneralProgramCalendarEvents', () => {
  it('creates one operation-start event for scheduled view', () => {
    const events = buildGeneralProgramCalendarEvents([createProgram()], 'SCHEDULED')

    expect(events).toHaveLength(1)
    expect(events[0]?.scheduleContent).toBe('운영 시작')
    expect(events[0]?.startDate).toBe('2026-04-03T00:00:00')
    expect(events[0]?.timeLabel).toBe('2026.04.03 ~ 2026.11.20')
  })

  it('creates one operation-end event for completed view', () => {
    const events = buildGeneralProgramCalendarEvents([createProgram()], 'COMPLETED')

    expect(events).toHaveLength(1)
    expect(events[0]?.scheduleContent).toBe('운영 종료')
    expect(events[0]?.startDate).toBe('2026-11-20T00:00:00')
    expect(events[0]?.timeLabel).toBe('2026.04.03 ~ 2026.11.20')
  })

  it('creates recruitment, operation, education, survey, and assignment events for all view', () => {
    const events = buildGeneralProgramCalendarEvents([createProgram()], 'ALL')
    const contents = events.map(event => event.scheduleContent)

    expect(contents).toEqual(
      expect.arrayContaining([
        '참여자 모집 시작',
        '참여자 모집 종료',
        '사업 운영 시작',
        '사업 운영 종료',
        '1회차 교육',
        '2회차 교육',
        '설문조사 시작',
        '과제 제출 마감',
      ])
    )
    expect(events.find(event => event.scheduleContent === '1회차 교육')?.timeLabel).toBe(
      '09:30 ~ 12:20'
    )
  })

  it('normalizes single-session education label', () => {
    const events = buildGeneralProgramCalendarEvents(
      [
        createProgram({
          generalProgramEducationStructure: 'schedule',
          generalProgramSessionRound: 'single',
          generalCommonInfo: {
            educationScheduleLines: ['26년 4월 20일(월) 09:30 ~ 12:20'],
            scheduleDetails: [{ scheduleLabel: '세부 일정 01', name: '오리엔테이션' }],
          },
        }),
      ],
      'ALL'
    )

    expect(events.find(event => event.kind === 'education')?.scheduleContent).toBe('1회차 교육')
  })
})
