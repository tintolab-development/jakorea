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
    expect(sessions?.[0]?.date).toBe('2026. 10. 20')
    expect(sessions?.[0]?.resolvedScheduleId).toBe(186621)
    expect(sessions?.[0]?.requestedScheduleId).toBeUndefined()
    expect(sessions?.[2]?.scheduleUnresolved).toBe(true)
    expect(formatRequestedSchedulesPeriodLabel([schedules[0]!])).toBe('2026. 10. 20(화) 10:00 ~ 12:00')
  })
})
