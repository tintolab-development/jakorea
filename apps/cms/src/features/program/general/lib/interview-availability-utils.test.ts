import { describe, expect, it } from 'vitest'
import { countInterviewAvailabilitySlots } from './interview-availability-utils'

describe('countInterviewAvailabilitySlots', () => {
  it('null·undefined 면접 슬롯은 0으로 센다', () => {
    expect(countInterviewAvailabilitySlots(undefined)).toBe(0)
    expect(countInterviewAvailabilitySlots(null)).toBe(0)
    expect(countInterviewAvailabilitySlots([{ dateLabel: '11/18', slots: undefined as never }])).toBe(
      0
    )
  })
})
