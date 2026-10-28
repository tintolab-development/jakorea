import { describe, expect, it } from 'vitest'
import {
  NOTIFY_TIMING_CAPABILITY,
  UNSUPPORTED_ANNOUNCEMENT_IMMEDIATE_ONLY_MESSAGE,
  UNSUPPORTED_ANNOUNCEMENT_NOTIFY_MESSAGE,
  UNSUPPORTED_MANUAL_NOTIFY_MESSAGE,
  UnsupportedNotifyTimingError,
  assertNotifyTimingSupported,
  getUnsupportedNotifyTimingMessage,
  isNotifyTimingSupported,
} from './notify-timing-capability'

describe('getUnsupportedNotifyTimingMessage', () => {
  it('timedBulk는 즉시·직접설정·발표일을 허용한다', () => {
    expect(isNotifyTimingSupported('immediate', NOTIFY_TIMING_CAPABILITY.timedBulk)).toBe(true)
    expect(isNotifyTimingSupported('manual', NOTIFY_TIMING_CAPABILITY.timedBulk)).toBe(true)
    expect(isNotifyTimingSupported('on_announcement', NOTIFY_TIMING_CAPABILITY.timedBulk)).toBe(
      true
    )
  })

  it('scheduledOnly에서 발표일을 막는다', () => {
    expect(
      getUnsupportedNotifyTimingMessage('on_announcement', NOTIFY_TIMING_CAPABILITY.scheduledOnly)
    ).toBe(UNSUPPORTED_ANNOUNCEMENT_NOTIFY_MESSAGE)
    expect(isNotifyTimingSupported('manual', NOTIFY_TIMING_CAPABILITY.scheduledOnly)).toBe(true)
  })

  it('immediateOnly에서 발표일·직접 설정을 막는다', () => {
    expect(
      getUnsupportedNotifyTimingMessage('on_announcement', NOTIFY_TIMING_CAPABILITY.immediateOnly)
    ).toBe(UNSUPPORTED_ANNOUNCEMENT_IMMEDIATE_ONLY_MESSAGE)
    expect(
      getUnsupportedNotifyTimingMessage('manual', NOTIFY_TIMING_CAPABILITY.immediateOnly)
    ).toBe(UNSUPPORTED_MANUAL_NOTIFY_MESSAGE)
    expect(isNotifyTimingSupported('immediate', NOTIFY_TIMING_CAPABILITY.immediateOnly)).toBe(true)
  })

  it('full은 세 옵션 모두 허용한다', () => {
    expect(isNotifyTimingSupported('immediate', NOTIFY_TIMING_CAPABILITY.full)).toBe(true)
    expect(isNotifyTimingSupported('manual', NOTIFY_TIMING_CAPABILITY.full)).toBe(true)
    expect(isNotifyTimingSupported('on_announcement', NOTIFY_TIMING_CAPABILITY.full)).toBe(true)
  })
})

describe('assertNotifyTimingSupported', () => {
  it('미지원 옵션이면 UnsupportedNotifyTimingError를 던진다', () => {
    expect(() =>
      assertNotifyTimingSupported('on_announcement', NOTIFY_TIMING_CAPABILITY.scheduledOnly)
    ).toThrow(UnsupportedNotifyTimingError)
    expect(() =>
      assertNotifyTimingSupported('immediate', NOTIFY_TIMING_CAPABILITY.timedBulk)
    ).not.toThrow()
  })
})
