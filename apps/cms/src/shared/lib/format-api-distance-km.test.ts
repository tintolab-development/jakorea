import { describe, expect, it } from 'vitest'
import { formatApiDistanceKmDisplay } from '@/shared/lib/format-api-distance-km'

describe('formatApiDistanceKmDisplay', () => {
  it('returns - for nullish', () => {
    expect(formatApiDistanceKmDisplay(null)).toBe('-')
    expect(formatApiDistanceKmDisplay(undefined)).toBe('-')
  })

  it('formats one decimal km from BE', () => {
    expect(formatApiDistanceKmDisplay(287.44)).toBe('287.4km')
    expect(formatApiDistanceKmDisplay(12.3)).toBe('12.3km')
    expect(formatApiDistanceKmDisplay(10)).toBe('10km')
  })

  it('does not append 장거리 when longDistance is false even if km is high', () => {
    expect(formatApiDistanceKmDisplay(150, { longDistance: false })).toBe('150km')
    expect(formatApiDistanceKmDisplay(250, { longDistance: false })).toBe('250km')
  })

  it('appends 장거리 only when BE longDistance is true', () => {
    expect(formatApiDistanceKmDisplay(250, { longDistance: true })).toBe('250km (장거리)')
    expect(formatApiDistanceKmDisplay(100, { longDistance: true })).toBe('100km (장거리)')
  })

  it('does not append 장거리 when option is omitted', () => {
    expect(formatApiDistanceKmDisplay(250)).toBe('250km')
  })
})
