import { describe, expect, it } from 'vitest'
import { mapRequestedSchedulesToSessions } from './map-requested-schedules'

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
})
