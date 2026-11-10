import { describe, expect, it } from 'vitest'
import { formatSmsMessageTypeCode } from './message-type'

describe('formatSmsMessageTypeCode', () => {
  it('shows SMS/LMS/MMS codes as-is', () => {
    expect(formatSmsMessageTypeCode('LMS')).toBe('LMS')
    expect(formatSmsMessageTypeCode(' mms ')).toBe('MMS')
    expect(formatSmsMessageTypeCode('SMS')).toBe('SMS')
  })

  it('falls back to "-" for empty or unknown values', () => {
    expect(formatSmsMessageTypeCode('')).toBe('-')
    expect(formatSmsMessageTypeCode(null)).toBe('-')
    expect(formatSmsMessageTypeCode('KAKAO')).toBe('-')
  })
})
