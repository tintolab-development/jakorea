import { describe, expect, it } from 'vitest'
import dayjs from 'dayjs'
import {
  defaultLectureFeePaymentScheduledDate,
  thirdTuesdayOfMonth,
} from './third-tuesday-of-month'

describe('thirdTuesdayOfMonth', () => {
  it('2026년 2월 셋째 화요일은 17일', () => {
    expect(thirdTuesdayOfMonth(dayjs('2026-02-01')).format('YYYY-MM-DD')).toBe('2026-02-17')
  })

  it('다음 달 셋째 화요일을 기본 예정일로 쓴다', () => {
    expect(defaultLectureFeePaymentScheduledDate(dayjs('2026-01-10')).format('YYYY-MM-DD')).toBe(
      '2026-02-17'
    )
  })
})
