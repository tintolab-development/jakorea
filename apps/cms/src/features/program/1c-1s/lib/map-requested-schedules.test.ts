import { describe, expect, it } from 'vitest'
import {
  formatRequestedSchedulesPeriodLabel,
  mapRequestedSchedulesToSessions,
} from './map-requested-schedules'
import type { RequestedScheduleWithResolved } from '@/features/program/general/api/instructor-assignment-types'

describe('mapRequestedSchedulesToSessions', () => {
  it('resolvedScheduleId null이면 scheduleUnresolved', () => {
    const sessions = mapRequestedSchedulesToSessions([
      {
        id: 123,
        preferenceOrder: 1,
        requestedDate: '2026-09-12',
        startPeriod: 1,
        sessionCount: 1,
        resolvedScheduleId: null,
      },
    ])
    expect(sessions?.[0]?.requestedScheduleId).toBe(123)
    expect(sessions?.[0]?.resolvedScheduleId).toBeNull()
    expect(sessions?.[0]?.scheduleUnresolved).toBe(true)
  })

  it('resolvedScheduleId 필드가 없으면 unresolved로 보지 않는다', () => {
    const sessions = mapRequestedSchedulesToSessions([
      {
        id: 1,
        preferenceOrder: 1,
        requestedDate: '2026-09-12',
        startPeriod: 1,
        sessionCount: 1,
      },
    ])
    expect(sessions?.[0]?.scheduleUnresolved).toBeUndefined()
    expect(sessions?.[0]?.resolvedScheduleId).toBeUndefined()
  })

  it('일반 기관 날짜 지정형(startPeriod null)은 개수 제한 없이 시각으로 표시한다', () => {
    const row = (
      order: number,
      date: string,
      times: { startTime: string; endTime: string }[],
      resolved: number | null
    ): RequestedScheduleWithResolved => ({
      id: null as unknown as number,
      preferenceOrder: order,
      requestedDate: date,
      startPeriod: null as unknown as number,
      sessionCount: 1,
      combinedClassYn: false,
      sessionTimes: times.map(t => ({ sessionOrder: 1, period: null as unknown as number, ...t })),
      resolvedScheduleId: resolved,
    })
    const schedules = [
      row(1, '2026-10-20', [{ startTime: '10:00:00', endTime: '12:00:00' }], 186621),
      row(2, '2026-10-27', [{ startTime: '13:30:00', endTime: '16:00:00' }], 186622),
      row(3, '2026-11-03', [{ startTime: '09:30:00', endTime: '11:30:00' }], null),
      row(4, '2026-11-17', [], 186624),
    ]
    const sessions = mapRequestedSchedulesToSessions(schedules)
    expect(sessions).toHaveLength(4)
    expect(sessions?.map(s => s.timeRange)).toEqual([
      '10:00 ~ 12:00',
      '13:30 ~ 16:00',
      '09:30 ~ 11:30',
      '종일',
    ])
    expect(sessions?.[0]?.date).toBe('2026.10.20')
    expect(sessions?.[0]?.resolvedScheduleId).toBe(186621)
    expect(sessions?.[0]?.requestedScheduleId).toBeUndefined()
    expect(sessions?.[2]?.scheduleUnresolved).toBe(true)
    expect(formatRequestedSchedulesPeriodLabel([schedules[0]!])).toBe('2026.10.20(화) 10:00 ~ 12:00')
  })

  it('startPeriod가 있어도 sessionTimes·label이 있으면 시각 지정형으로 매핑한다', () => {
    const sessions = mapRequestedSchedulesToSessions([
      {
        id: 184839,
        preferenceOrder: 1,
        requestedDate: '2026-10-26',
        startPeriod: 1,
        sessionCount: 1,
        combinedClassYn: false,
        sessionTimes: [
          {
            sessionOrder: 1,
            period: 1,
            startTime: '10:00:00',
            endTime: '12:00:00',
          },
        ],
        resolvedScheduleId: null,
        label: '26년 10월 26일(월) 10:00 ~ 12:00',
        periodStartDate: '2026-10-26',
        periodEndDate: '2026-10-26',
      },
    ])

    expect(sessions).toHaveLength(1)
    expect(sessions?.[0]?.scheduleLabel).toBe('26년 10월 26일(월) 10:00 ~ 12:00')
    expect(sessions?.[0]?.timeRange).toBe('10:00 ~ 12:00')
    expect(sessions?.[0]?.date).toBe('26년 10월 26일(월) 10:00 ~ 12:00')
  })

  it('PERIOD 구간 label을 scheduleLabel로 매핑한다', () => {
    const sessions = mapRequestedSchedulesToSessions([
      {
        id: 10001,
        preferenceOrder: 1,
        requestedDate: '2026-10-28',
        startPeriod: null,
        sessionCount: 1,
        combinedClassYn: false,
        sessionTimes: [],
        resolvedScheduleId: 186659,
        label: '26년 10월 28일(수) ~ 26년 11월 12일(목)',
        periodStartDate: '2026-10-28',
        periodEndDate: '2026-11-12',
      },
      {
        id: 10002,
        preferenceOrder: 2,
        requestedDate: '2026-11-25',
        startPeriod: null,
        sessionCount: 1,
        combinedClassYn: false,
        sessionTimes: [],
        resolvedScheduleId: 186659,
        label: '26년 11월 25일(수) ~ 26년 12월 11일(금)',
      },
    ])

    expect(sessions).toHaveLength(2)
    expect(sessions?.[0]?.scheduleLabel).toBe('26년 10월 28일(수) ~ 26년 11월 12일(목)')
    expect(sessions?.[1]?.scheduleLabel).toBe('26년 11월 25일(수) ~ 26년 12월 11일(금)')
  })

  it('일반 기관 총 차시 수 + 시간 1구간은 sessionCount로 차시를 표기하고 교시를 쓰지 않는다', () => {
    const sessions = mapRequestedSchedulesToSessions([
      {
        id: 20001,
        preferenceOrder: 1,
        requestedDate: '2026-11-08',
        startPeriod: null,
        sessionCount: 3,
        combinedClassYn: false,
        sessionTimes: [{ sessionOrder: 1, period: 1, startTime: '09:00:00', endTime: '10:00:00' }],
      },
    ])

    expect(sessions).toHaveLength(1)
    expect(sessions?.[0]?.timeRange).toBe('09:00 ~ 10:00')
    expect(sessions?.[0]?.duration).toBe('3차시')
    expect(sessions?.[0]?.classNum).toBe('3차시')
    expect(JSON.stringify(sessions)).not.toContain('교시')
    expect(JSON.stringify(sessions)).not.toContain('null')
  })

  it('일반 기관 차시별 sessionTimes는 처음 시작 ~ 마지막 종료로 표시한다', () => {
    const [session] =
      mapRequestedSchedulesToSessions([
        {
          id: 20002,
          preferenceOrder: 1,
          requestedDate: '2026-11-08',
          startPeriod: null,
          sessionCount: 2,
          combinedClassYn: false,
          sessionTimes: [
            { sessionOrder: 1, period: 1, startTime: '09:00:00', endTime: '09:40:00' },
            { sessionOrder: 2, period: 2, startTime: '09:50:00', endTime: '10:30:00' },
          ],
        },
      ]) ?? []

    expect(session?.timeRange).toBe('09:00 ~ 10:30')
    expect(session?.duration).toBe('2차시')
  })
})
