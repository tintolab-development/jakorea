import { describe, expect, it } from 'vitest'
import dayjs from 'dayjs'
import {
  SCHEDULED_AT_MUST_BE_FUTURE_MESSAGE,
  formatNotificationSendScheduleDisplay,
  isScheduledAtInFuture,
  nextNotificationSendSchedule,
  resolveScheduledAtForCreateRequest,
  snapNotificationSendSchedule,
  validateNotificationScheduledAt,
} from './send-scheduled-at'

describe('resolveScheduledAtForCreateRequest', () => {
  it('omits scheduledAt for immediate send', () => {
    expect(
      resolveScheduledAtForCreateRequest({
        sendTiming: 'immediate',
        scheduledAt: '2026-09-09T07:00:00.000Z',
      })
    ).toBeUndefined()
  })

  it('returns ISO for scheduled send', () => {
    expect(
      resolveScheduledAtForCreateRequest({
        sendTiming: 'scheduled',
        scheduledAt: '2026-09-09T07:00:00.000Z',
      })
    ).toBe('2026-09-09T07:00:00.000Z')
  })
})

describe('validateNotificationScheduledAt', () => {
  const nowMs = Date.parse('2026-09-09T06:00:00.000Z')

  it('requires value when scheduled', () => {
    expect(
      validateNotificationScheduledAt({
        sendTiming: 'scheduled',
        scheduledAt: null,
        nowMs,
      })
    ).toBe('예약 일시를 선택하세요.')
  })

  it('rejects past scheduledAt', () => {
    expect(
      validateNotificationScheduledAt({
        sendTiming: 'scheduled',
        scheduledAt: '2026-09-08T18:45:00.000Z',
        nowMs,
      })
    ).toBe(SCHEDULED_AT_MUST_BE_FUTURE_MESSAGE)
  })

  it('accepts future scheduledAt', () => {
    expect(
      validateNotificationScheduledAt({
        sendTiming: 'scheduled',
        scheduledAt: '2026-09-09T07:00:00.000Z',
        nowMs,
      })
    ).toBeNull()
  })

  it('skips check for immediate', () => {
    expect(
      validateNotificationScheduledAt({
        sendTiming: 'immediate',
        scheduledAt: '2026-09-08T18:45:00.000Z',
        nowMs,
      })
    ).toBeNull()
  })
})

describe('isScheduledAtInFuture', () => {
  it('requires buffer beyond now', () => {
    const nowMs = Date.parse('2026-09-09T06:00:00.000Z')
    expect(isScheduledAtInFuture('2026-09-09T06:00:30.000Z', nowMs, 60)).toBe(false)
    expect(isScheduledAtInFuture('2026-09-09T06:01:01.000Z', nowMs, 60)).toBe(true)
  })
})

describe('snapNotificationSendSchedule', () => {
  it('returns null for empty', () => {
    expect(snapNotificationSendSchedule(null)).toBeNull()
  })

  it('snaps to 30-minute grid and clears seconds', () => {
    const snapped = snapNotificationSendSchedule(dayjs('2026-03-09T09:14:45.123'))
    expect(snapped?.format('HH:mm:ss.SSS')).toBe('09:00:00.000')
    expect(snapNotificationSendSchedule(dayjs('2026-03-09T09:16:01'))?.format('HH:mm')).toBe(
      '09:30'
    )
  })
})

describe('nextNotificationSendSchedule', () => {
  it('returns the next future 30-minute slot after buffer', () => {
    const now = dayjs('2026-03-09T09:14:10')
    expect(nextNotificationSendSchedule(now, 30, 60).format('YYYY-MM-DD HH:mm:ss')).toBe(
      '2026-03-09 09:30:00'
    )
  })

  it('bumps past a slot that is not after the buffered now', () => {
    const now = dayjs('2026-03-09T09:29:30')
    expect(nextNotificationSendSchedule(now, 30, 60).format('HH:mm')).toBe('10:00')
  })
})

describe('formatNotificationSendScheduleDisplay', () => {
  it('formats date with HH:mm (no seconds)', () => {
    expect(formatNotificationSendScheduleDisplay(dayjs('2026-03-09T09:15:30'))).toMatch(
      /2026\. 03\. 09\(.\) 09:15$/
    )
  })
})
