import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'
import {
  NOTIFY_TIMING_CAPABILITY,
  UnsupportedNotifyTimingError,
} from '@/shared/lib/notify-timing-capability'
import { toInstructorApplicationNotificationRequest } from './instructor-application-notification'

const scheduled = dayjs('2026-11-01T10:00:00+09:00')

describe('toInstructorApplicationNotificationRequest', () => {
  it('즉시 발송은 IMMEDIATE이고 scheduledAt은 null이다', () => {
    expect(toInstructorApplicationNotificationRequest('immediate', scheduled)).toEqual({
      timing: 'IMMEDIATE',
      scheduledAt: null,
    })
  })

  it('직접 설정은 SCHEDULED + ISO scheduledAt이다', () => {
    expect(toInstructorApplicationNotificationRequest('manual', scheduled)).toEqual({
      timing: 'SCHEDULED',
      scheduledAt: scheduled.toISOString(),
    })
  })

  it('발표일을 즉시 발송으로 바꾸지 않고 차단한다', () => {
    expect(() => toInstructorApplicationNotificationRequest('on_announcement', scheduled)).toThrow(
      UnsupportedNotifyTimingError
    )
  })

  it('full capability(일반 기관형)면 발표일을 ON_ANNOUNCEMENT로 보낸다', () => {
    expect(
      toInstructorApplicationNotificationRequest(
        'on_announcement',
        scheduled,
        NOTIFY_TIMING_CAPABILITY.full
      )
    ).toEqual({ timing: 'ON_ANNOUNCEMENT', scheduledAt: null })
  })
})
