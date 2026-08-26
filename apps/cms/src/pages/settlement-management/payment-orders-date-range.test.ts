import dayjs from 'dayjs'
import { describe, expect, it, vi, afterEach } from 'vitest'
import {
  getPaymentOrdersDefaultDateRange,
  getPaymentOrdersDefaultDateRangeParams,
  getPaymentOrdersMonthFilterRange,
  getPaymentOrdersOneMonthRangeFrom,
  isPaymentOrdersListDateRangeReady,
  resolvePaymentOrdersCalendarFilterRange,
} from './payment-orders-date-range'

describe('payment-orders-date-range', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('기본 기간은 당월 1일 ~ 익월 1일', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-24T12:00:00+09:00'))

    const [start, end] = getPaymentOrdersDefaultDateRange()
    expect(start.format('YYYY-MM-DD')).toBe('2026-08-01')
    expect(end.format('YYYY-MM-DD')).toBe('2026-09-01')

    const params = getPaymentOrdersDefaultDateRangeParams()
    expect(params).toEqual({ from: '2026-08-01', to: '2026-09-01' })
  })

  it('시작일 선택 시 해당 일로부터 한 달 구간을 만든다', () => {
    const start = dayjs('2026-08-15')
    const [from, to] = getPaymentOrdersOneMonthRangeFrom(start)
    expect(from.format('YYYY-MM-DD')).toBe('2026-08-15')
    expect(to.format('YYYY-MM-DD')).toBe('2026-09-15')
  })

  it('캘린더 월 필터는 해당 월 1일 ~ 익월 1일', () => {
    const [from, to] = getPaymentOrdersMonthFilterRange(dayjs('2026-08-15'))
    expect(from.format('YYYY-MM-DD')).toBe('2026-08-01')
    expect(to.format('YYYY-MM-DD')).toBe('2026-09-01')
  })

  it('조회 적용 출강일 → 캘린더 필터 월간 구간', () => {
    const applied: [ReturnType<typeof dayjs>, ReturnType<typeof dayjs>] = [
      dayjs('2025-09-15'),
      dayjs('2025-10-15'),
    ]
    const [from, to] = resolvePaymentOrdersCalendarFilterRange(
      applied,
      dayjs('2026-01-01')
    )
    expect(from.format('YYYY-MM-DD')).toBe('2025-09-01')
    expect(to.format('YYYY-MM-DD')).toBe('2025-10-01')
  })

  it('조회 출강일 없으면 fallback 앵커 월간 구간', () => {
    const [from, to] = resolvePaymentOrdersCalendarFilterRange(null, dayjs('2025-11-20'))
    expect(from.format('YYYY-MM-DD')).toBe('2025-11-01')
    expect(to.format('YYYY-MM-DD')).toBe('2025-12-01')
  })

  it('출강일이 없거나 2025 시드면 목록 API를 아직 치지 않는다', () => {
    expect(isPaymentOrdersListDateRangeReady(null, null)).toBe(false)
    expect(isPaymentOrdersListDateRangeReady('2025-01-01', '2025-02-01')).toBe(false)
    expect(isPaymentOrdersListDateRangeReady('2026-08-01', '2026-09-01')).toBe(true)
  })
})
