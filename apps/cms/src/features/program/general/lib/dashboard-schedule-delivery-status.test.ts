import { describe, expect, it } from 'vitest'
import {
  isScheduleAttendanceOpenForDisplay,
  mapDashboardScheduleDeliveryToEducationProgress,
  mapDashboardScheduleDeliveryToSessionStatus,
  resolveDashboardScheduleDeliveryProgressLabel,
} from '@/features/program/general/lib/dashboard-schedule-delivery-status'

describe('dashboard-schedule-delivery-status', () => {
  it('maps delivery status to session status without using attendance', () => {
    expect(mapDashboardScheduleDeliveryToSessionStatus('SCHEDULED')).toBe('pending')
    expect(mapDashboardScheduleDeliveryToSessionStatus('IN_PROGRESS')).toBe('pending')
    expect(mapDashboardScheduleDeliveryToSessionStatus('COMPLETED')).toBe('completed')
    expect(mapDashboardScheduleDeliveryToSessionStatus('UNSCHEDULED')).toBe('not_planned')
  })

  it('maps future schedule to scheduled education progress', () => {
    expect(mapDashboardScheduleDeliveryToEducationProgress('SCHEDULED')).toBe('scheduled')
    expect(mapDashboardScheduleDeliveryToEducationProgress('IN_PROGRESS')).toBe('scheduled')
    expect(mapDashboardScheduleDeliveryToEducationProgress('COMPLETED')).toBe('completed')
  })

  it('resolves display labels', () => {
    expect(resolveDashboardScheduleDeliveryProgressLabel('SCHEDULED')).toBe('진행 대기')
    expect(resolveDashboardScheduleDeliveryProgressLabel('IN_PROGRESS')).toBe('진행 중')
    expect(resolveDashboardScheduleDeliveryProgressLabel('COMPLETED')).toBe('진행 완료')
  })

  it('blocks attendance display before session start or while scheduled', () => {
    const beforeStart = new Date('2026-10-11T12:00:00+09:00')
    const afterStart = new Date('2026-10-27T05:37:00+09:00')
    expect(
      isScheduleAttendanceOpenForDisplay(
        { scheduleStatus: 'SCHEDULED', startAt: '2026-10-15T10:00:00+09:00' },
        beforeStart
      )
    ).toBe(false)
    expect(
      isScheduleAttendanceOpenForDisplay(
        { scheduleStatus: 'IN_PROGRESS', startAt: '2026-10-15T10:00:00+09:00' },
        beforeStart
      )
    ).toBe(false)
    expect(
      isScheduleAttendanceOpenForDisplay(
        { scheduleStatus: 'IN_PROGRESS', startAt: '2026-10-10T10:00:00+09:00' },
        beforeStart
      )
    ).toBe(true)
    expect(
      isScheduleAttendanceOpenForDisplay(
        { scheduleStatus: 'SCHEDULED', startAt: '2026-10-27T03:55:00+09:00' },
        afterStart
      )
    ).toBe(true)
    expect(
      isScheduleAttendanceOpenForDisplay(
        { scheduleStatus: 'CANCELLED', startAt: '2026-10-27T03:55:00+09:00' },
        afterStart
      )
    ).toBe(false)
  })
})
