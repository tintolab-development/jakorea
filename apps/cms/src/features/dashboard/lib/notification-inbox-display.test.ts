import { describe, expect, it } from 'vitest'
import { formatNotificationDateTime } from './notification-inbox-display'

describe('formatNotificationDateTime', () => {
  it('YYYY.MM.DD HH:mm (로컬 시각, 0 채움)', () => {
    expect(formatNotificationDateTime(new Date(2026, 0, 5, 9, 7))).toBe('2026.01.05 09:07')
    expect(formatNotificationDateTime(new Date(2026, 10, 12, 23, 59))).toBe('2026.11.12 23:59')
  })

  it('해석할 수 없는 값은 빈 문자열', () => {
    expect(formatNotificationDateTime('not-a-date')).toBe('')
  })
})
