import { describe, expect, it } from 'vitest'
import { resolveNotificationServerCategory } from './notification-tab-category'

describe('resolveNotificationServerCategory', () => {
  it.each([
    ['matching', 'APPLICATION_MATCHING'],
    ['progress', 'PROGRAM_PROGRESS'],
    ['settlement', 'SETTLEMENT'],
    ['inquiry', 'INQUIRY_SYSTEM'],
    ['schedule', 'UPDATE'],
  ] as const)('%s 탭은 서버 category %s로 조회한다', (tab, expected) => {
    expect(resolveNotificationServerCategory(tab)).toBe(expected)
  })

  it.each(['all', 'system'] as const)('%s 탭은 category 없이 전체 목록을 받는다', tab => {
    expect(resolveNotificationServerCategory(tab)).toBeUndefined()
  })
})
