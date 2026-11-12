import { describe, expect, it } from 'vitest'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import {
  buildCompanySchoolHopeScheduleBlocks,
  resolveCompanySchoolProgressDisplaySessions,
} from './progress-schedule-display'

const confirmed: ParticipatingSchoolSession = {
  round: 1,
  date: '2026.04.27',
  dayOfWeek: '월',
  duration: '-',
  format: '-',
  classNum: '',
  timeRange: '09:00 ~ 10:30',
  status: 'pending',
  resolvedScheduleId: 187538,
}
const hope: ParticipatingSchoolSession = {
  ...confirmed,
  date: '2026.04.28',
  dayOfWeek: '화',
  classNum: '1지망',
  resolvedScheduleId: null,
  scheduleUnresolved: true,
  preferenceOrder: 1,
}

describe('1사1교 진행 현황 일정 기준', () => {
  it('확정 일정이 있으면 확정 일정만', () => {
    expect(
      resolveCompanySchoolProgressDisplaySessions({ sessions: [confirmed], hopeEducationSessions: [hope] })
    ).toEqual([confirmed])
  })

  it('확정 일정이 없으면 희망 일정', () => {
    expect(
      resolveCompanySchoolProgressDisplaySessions({ sessions: [], hopeEducationSessions: [hope] })
    ).toEqual([hope])
  })
})

describe('buildCompanySchoolHopeScheduleBlocks', () => {
  it('requested-schedules → 날짜·차시 수·교시별 시간, 지망 순', () => {
    const blocks = buildCompanySchoolHopeScheduleBlocks([
      {
        id: 2,
        preferenceOrder: 2,
        requestedDate: '2026-04-29',
        startPeriod: 3,
        sessionCount: 1,
        sessionTimes: [{ sessionOrder: 1, period: 3, startTime: '10:40:00', endTime: '11:20:00' }],
      },
      {
        id: 1,
        preferenceOrder: 1,
        requestedDate: '2026-04-27',
        startPeriod: 1,
        sessionCount: 2,
        sessionTimes: [
          { sessionOrder: 1, period: 1, startTime: '09:00:00', endTime: '09:40:00' },
          { sessionOrder: 2, period: null, startTime: '09:50:00', endTime: '10:30:00' },
        ],
      },
    ])
    expect(blocks).toEqual([
      {
        key: '1',
        preferenceOrder: 1,
        dateLabel: '2026.04.27(월)',
        sessionCount: 2,
        startPeriod: 1,
        dateUnitSegments: ['2026.04.27(월)', '1~2교시 (2차시)'],
        periodTimeLabels: ['1교시 (09:00 ~ 09:40)', '2교시 (09:50 ~ 10:30)'],
      },
      {
        key: '2',
        preferenceOrder: 2,
        dateLabel: '2026.04.29(수)',
        sessionCount: 1,
        startPeriod: 3,
        dateUnitSegments: ['2026.04.29(수)', '3교시 (1차시)'],
        periodTimeLabels: ['3교시 (10:40 ~ 11:20)'],
      },
    ])
  })

  it('교시를 모르면 시간만, 날짜 없는 행은 뺀다', () => {
    expect(
      buildCompanySchoolHopeScheduleBlocks([
        { id: 3, sessionTimes: [{ startTime: '09:00', endTime: '09:40' }], requestedDate: '2026-04-27' },
        { id: 4, sessionCount: 1 },
      ]).map(block => block.periodTimeLabels)
    ).toEqual([['09:00 ~ 09:40']])
  })
})
