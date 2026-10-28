import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'
import {
  getDefaultManualNotifyAt,
  getMinimumManualNotifyAt,
  getNotificationTimingApiErrorMessage,
  isFutureNotificationTime,
} from './notification-schedule'

describe('notification schedule', () => {
  it('initializes manual notification time in the future', () => {
    expect(getDefaultManualNotifyAt().isAfter(dayjs())).toBe(true)
  })

  it('rejects missing, invalid, and past notification times', () => {
    expect(isFutureNotificationTime()).toBe(false)
    expect(isFutureNotificationTime(dayjs('invalid'))).toBe(false)
    expect(isFutureNotificationTime(dayjs().subtract(1, 'minute'))).toBe(false)
  })

  it('requires at least 60 seconds of lead time', () => {
    const now = dayjs('2026-10-15T09:00:00.000')
    expect(isFutureNotificationTime(now.add(30, 'second'), now)).toBe(false)
    expect(isFutureNotificationTime(getMinimumManualNotifyAt(now), now)).toBe(true)
    expect(isFutureNotificationTime(now.add(5, 'minute'), now)).toBe(true)
  })

  it('maps announcement-date and resend 409 codes', () => {
    expect(
      getNotificationTimingApiErrorMessage({
        response: { data: { error: { code: 'APPLICATION_ANNOUNCEMENT_DATE_NOT_CONFIGURED' } } },
      })
    ).toContain('발표일이 설정되지 않아')
    expect(
      getNotificationTimingApiErrorMessage({
        response: {
          data: { error: { code: 'INSTRUCTOR_ROLE_REQUEST_NOTIFICATION_RESEND_REQUIRES_DECIDED' } },
        },
      })
    ).toContain('강사 권한')
    expect(
      getNotificationTimingApiErrorMessage({
        response: { data: { error: { code: 'ADMIN_NOTIFICATION_RESEND_REQUIRES_DECIDED' } } },
      })
    ).toContain('관리자')
  })
})
