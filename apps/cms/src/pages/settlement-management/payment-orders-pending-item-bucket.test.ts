import { describe, expect, it } from 'vitest'
import {
  mapPendingItemBucketToApi,
  matchesPendingItemBucket,
} from './payment-orders-pending-item-bucket'

describe('matchesPendingItemBucket', () => {
  it('전체는 항상 통과', () => {
    expect(matchesPendingItemBucket(0, 'all')).toBe(true)
    expect(matchesPendingItemBucket(12, 'all')).toBe(true)
  })

  it('버킷 경계를 맞춘다', () => {
    expect(matchesPendingItemBucket(0, 'none')).toBe(true)
    expect(matchesPendingItemBucket(1, 'none')).toBe(false)
    expect(matchesPendingItemBucket(1, '1_5')).toBe(true)
    expect(matchesPendingItemBucket(5, '1_5')).toBe(true)
    expect(matchesPendingItemBucket(6, '1_5')).toBe(false)
    expect(matchesPendingItemBucket(6, '6_10')).toBe(true)
    expect(matchesPendingItemBucket(10, '6_10')).toBe(true)
    expect(matchesPendingItemBucket(11, '11_plus')).toBe(true)
  })
})

describe('mapPendingItemBucketToApi', () => {
  it('OpenAPI 문자열로 보낸다', () => {
    expect(mapPendingItemBucketToApi('none')).toBe('NONE')
    expect(mapPendingItemBucketToApi('11_plus')).toBe('11_PLUS')
  })
})
