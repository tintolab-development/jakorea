import { describe, expect, it } from 'vitest'
import {
  CALENDAR_ALL_DAY_TIME_LABEL,
  formatCalendarEventTimeLabel,
} from './format-calendar-event-time-label'

describe('formatCalendarEventTimeLabel', () => {
  it('returns 종일 when both clocks are missing', () => {
    expect(formatCalendarEventTimeLabel()).toBe(CALENDAR_ALL_DAY_TIME_LABEL)
    expect(formatCalendarEventTimeLabel('', '  ')).toBe(CALENDAR_ALL_DAY_TIME_LABEL)
  })

  it('returns start only without synthesizing an end range', () => {
    expect(formatCalendarEventTimeLabel('14:00')).toBe('14:00')
  })

  it('returns a range when both clocks exist', () => {
    expect(formatCalendarEventTimeLabel('09:30', '12:20')).toBe('09:30 ~ 12:20')
  })

  it('treats explicit 00:00 startTime as midnight, not all-day', () => {
    expect(formatCalendarEventTimeLabel('00:00')).toBe('00:00')
  })
})
