import { describe, expect, it } from 'vitest'
import dayjs from 'dayjs'
import { toInstructorRoleReviewScheduledAt } from './instructor-role-review-notify'

describe('toInstructorRoleReviewScheduledAt', () => {
  it('즉시·발표일은 scheduledAt을 넣지 않는다', () => {
    const at = dayjs('2026-11-01T10:00:00+09:00')
    expect(toInstructorRoleReviewScheduledAt('immediate', at)).toBeUndefined()
    expect(toInstructorRoleReviewScheduledAt('on_announcement', at)).toBeUndefined()
    expect(toInstructorRoleReviewScheduledAt(undefined, at)).toBeUndefined()
  })

  it('직접 설정은 ISO scheduledAt을 반환한다', () => {
    const at = dayjs('2026-11-01T10:00:00+09:00')
    expect(toInstructorRoleReviewScheduledAt('manual', at)).toBe(at.toISOString())
  })

  it('직접 설정인데 시각이 없으면 undefined', () => {
    expect(toInstructorRoleReviewScheduledAt('manual', null)).toBeUndefined()
    expect(toInstructorRoleReviewScheduledAt('manual', '')).toBeUndefined()
  })
})
