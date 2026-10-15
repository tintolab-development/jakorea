import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'
import { getDefaultManualNotifyAt, isFutureNotificationTime } from './notification-schedule'

describe('notification schedule', () => {
  it('initializes manual notification time in the future', () => {
    expect(getDefaultManualNotifyAt().isAfter(dayjs())).toBe(true)
  })

  it('rejects missing, invalid, and past notification times', () => {
    expect(isFutureNotificationTime()).toBe(false)
    expect(isFutureNotificationTime(dayjs('invalid'))).toBe(false)
    expect(isFutureNotificationTime(dayjs().subtract(1, 'minute'))).toBe(false)
  })

  it('accepts a future notification time', () => {
    expect(isFutureNotificationTime(dayjs().add(1, 'minute'))).toBe(true)
  })
})
