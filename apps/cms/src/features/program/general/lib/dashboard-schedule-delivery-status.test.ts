import { describe, expect, it } from 'vitest'
import {
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
})
