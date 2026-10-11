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

  it('appends 장거리 suffix when requested', () => {
    expect(formatApiDistanceKmDisplay(100, { longDistanceSuffix: true })).toBe('100km (장거리)')
  })
})
