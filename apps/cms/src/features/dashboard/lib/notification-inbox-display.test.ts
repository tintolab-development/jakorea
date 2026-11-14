import { describe, expect, it } from 'vitest'
import { formatNotificationDate } from './notification-inbox-display'

describe('formatNotificationDate', () => {
  it('YYYY.MM.DD (로컬 날짜, 0 채움, 시간 없음)', () => {
    expect(formatNotificationDate(new Date(2026, 0, 5, 9, 7))).toBe('2026.01.05')
    expect(formatNotificationDate(new Date(2026, 10, 12, 23, 59))).toBe('2026.11.12')
  })

  it('해석할 수 없는 값은 빈 문자열', () => {
    expect(formatNotificationDate('not-a-date')).toBe('')
  })
})
