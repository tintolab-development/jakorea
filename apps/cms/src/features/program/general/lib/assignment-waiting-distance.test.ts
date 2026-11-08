import { describe, expect, it } from 'vitest'
import {
  findWaitingOrganizationDistance,
  formatWaitingOrganizationDistance,
  formatWaitingScheduleDistance,
} from './assignment-waiting-distance'

describe('formatWaitingScheduleDistance', () => {
  const distances = [
    { scheduleId: 9001, distanceKm: 18.7, longDistance: false },
    { scheduleId: 9002, distanceKm: null, longDistance: null },
    { scheduleId: 9003, distanceKm: 0, longDistance: false },
    { scheduleId: 9004, distanceKm: 231.5, longDistance: true },
  ]

  it('matches by scheduleId and shows the server km with one decimal', () => {
    expect(formatWaitingScheduleDistance(distances, 9001)).toBe('18.7km')
    expect(formatWaitingScheduleDistance(distances, '9001')).toBe('18.7km')
  })

  it('shows - for null distance, unmatched schedule, missing list', () => {
    expect(formatWaitingScheduleDistance(distances, 9002)).toBe('-')
    expect(formatWaitingScheduleDistance(distances, 1234)).toBe('-')
    expect(formatWaitingScheduleDistance(undefined, 9001)).toBe('-')
    expect(formatWaitingScheduleDistance(distances, null)).toBe('-')
  })

  it('keeps 0.0km and marks 장거리 only when longDistance is true', () => {
    expect(formatWaitingScheduleDistance(distances, 9003)).toBe('0.0km')
    expect(formatWaitingScheduleDistance(distances, 9004)).toBe('231.5km (장거리)')
  })
})

describe('formatWaitingOrganizationDistance', () => {
  const distances = [
    { organizationId: 301, organizationApplicationId: 7001, distanceKm: 34.5, longDistance: false },
    { organizationId: null, organizationApplicationId: 7002, distanceKm: null, longDistance: null },
    { organizationId: 302, organizationApplicationId: 7003, distanceKm: 12, longDistance: false },
  ]

  it('matches organizationApplicationId first', () => {
    expect(
      formatWaitingOrganizationDistance(distances, { organizationApplicationId: '7001' })
    ).toBe('34.5km')
    expect(
      formatWaitingOrganizationDistance(distances, {
        organizationApplicationId: '7003',
        organizationId: 301,
      })
    ).toBe('12.0km')
  })

  it('does not fall back to organizationId when the row has an application id', () => {
    expect(
      formatWaitingOrganizationDistance(distances, {
        organizationApplicationId: '9999',
        organizationId: 301,
      })
    ).toBe('-')
  })

  it('falls back to organizationId only when the row has no application id', () => {
    expect(formatWaitingOrganizationDistance(distances, { organizationId: 302 })).toBe('12.0km')
  })

  it('never matches null organizationId to null', () => {
    expect(findWaitingOrganizationDistance(distances, { organizationId: null })).toBeUndefined()
    expect(findWaitingOrganizationDistance(distances, {})).toBeUndefined()
  })

  it('shows - when the matched distance is null', () => {
    expect(formatWaitingOrganizationDistance(distances, { organizationApplicationId: 7002 })).toBe(
      '-'
    )
  })
})
