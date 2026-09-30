import { describe, expect, it } from 'vitest'
import dayjs from 'dayjs'
import {
  alignUjatAutofillDatePlan,
  ujatAutofillHalfRanges,
} from './apply-dev-program-registration-autofill'

describe('UJAT 자동입력 날짜 정렬', () => {
  const plan = {
    business: { start: '2026-11-13T15:00:00.000Z', end: '2026-12-05T14:59:59.999Z' },
    program: { start: '2026-11-06T15:00:00.000Z', end: '2026-12-12T15:00:00.000Z' },
    recruit: { start: '2026-11-06T15:00:00.000Z', end: '2026-11-20T15:00:00.000Z' },
    interview: { start: '2026-11-10T15:00:00.000Z', end: '2026-11-18T15:00:00.000Z' },
  }

  it('프로그램 기간은 사업 기간 안에 둔다', () => {
    const next = alignUjatAutofillDatePlan(plan)
    expect(dayjs(next.program.start).isSame(dayjs(next.business.start), 'day')).toBe(true)
    expect(dayjs(next.program.end).isSame(dayjs(next.business.end), 'day')).toBe(true)
  })

  it('모집·면접은 사업 시작 이전이고 면접은 모집 안에 있다', () => {
    const next = alignUjatAutofillDatePlan(plan)
    expect(!dayjs(next.recruit.end).isAfter(dayjs(next.business.start), 'day')).toBe(true)
    expect(!dayjs(next.interview.start).isBefore(dayjs(next.recruit.start), 'day')).toBe(true)
    expect(!dayjs(next.interview.end).isAfter(dayjs(next.recruit.end), 'day')).toBe(true)
  })

  it('상·하반기 교육 일정은 사업 기간을 넘지 않는다', () => {
    const halves = ujatAutofillHalfRanges(plan.business)
    const bizStart = dayjs(plan.business.start).startOf('day')
    const bizEnd = dayjs(plan.business.end).startOf('day')
    for (const half of [halves.h1, halves.h2]) {
      expect(!half.start.isBefore(bizStart, 'day')).toBe(true)
      expect(!half.end.isAfter(bizEnd, 'day')).toBe(true)
      expect(!half.end.isBefore(half.start, 'day')).toBe(true)
    }
    expect(!halves.h2.start.isBefore(halves.h1.end, 'day')).toBe(true)
  })
})
