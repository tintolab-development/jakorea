import { describe, expect, it } from 'vitest'
import {
  coerceScheduleChangeCancelCount,
  resolveScheduleChangeCancelCountFromRecord,
} from '@/features/user/api/resolve-schedule-change-cancel-count'

describe('resolveScheduleChangeCancelCountFromRecord', () => {
  it('루트 scheduleChangeCancelCount를 읽는다', () => {
    expect(resolveScheduleChangeCancelCountFromRecord({ scheduleChangeCancelCount: 2 })).toBe(2)
  })

  it('member 중첩 scheduleChangeCancelCount를 읽는다', () => {
    expect(
      resolveScheduleChangeCancelCountFromRecord({
        member: { scheduleChangeCancelCount: 1 },
      })
    ).toBe(1)
  })

  it('scheduleChangeCount 동의어도 읽는다', () => {
    expect(resolveScheduleChangeCancelCountFromRecord({ scheduleChangeCount: 3 })).toBe(3)
  })

  it('유효하지 않은 값은 undefined', () => {
    expect(coerceScheduleChangeCancelCount(-1)).toBeUndefined()
    expect(coerceScheduleChangeCancelCount('')).toBeUndefined()
    expect(resolveScheduleChangeCancelCountFromRecord(null)).toBeUndefined()
  })
})
