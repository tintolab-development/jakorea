import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'
import { EMPTY_UJAT_HALF_EVENT_RANGE_SEAL } from './ujat-half-education-schedule-types'
import {
  ujatEventRangeToScheduleLine,
  ujatScheduleLineToEventRange,
} from './ujat-education-schedule-change-lines'

describe('ujat education schedule change lines', () => {
  it('저장된 상·하반기 기간을 팝업 일정 줄로 바꾸고 다시 seal로 돌린다', () => {
    const start = dayjs('2026-04-03').startOf('day')
    const end = dayjs('2026-06-19').startOf('day')
    const seal = { start: start.toISOString(), end: end.toISOString() }

    const line = ujatEventRangeToScheduleLine(seal)

    expect(line).toContain('2026.04.03')
    expect(line).toContain('2026.06.19')
    const restored = ujatScheduleLineToEventRange(line)
    expect(dayjs(restored.start).isSame(start, 'day')).toBe(true)
    expect(dayjs(restored.end).isSame(end, 'day')).toBe(true)
  })

  it('기간이 없으면 빈 줄이고, 빈 줄은 빈 seal이다', () => {
    expect(ujatEventRangeToScheduleLine(EMPTY_UJAT_HALF_EVENT_RANGE_SEAL)).toBe('')
    expect(ujatScheduleLineToEventRange('')).toEqual(EMPTY_UJAT_HALF_EVENT_RANGE_SEAL)
  })
})
