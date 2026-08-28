import { describe, expect, it } from 'vitest'
import dayjs from 'dayjs'
import { buildPaymentOrdersListAggregateParams } from './build-payment-orders-list-aggregate-params'

const emptyFilters = {
  programName: '',
  instructorName: '',
  processingStatus: 'all' as const,
  pendingItemBucket: 'all' as const,
  dateRange: null,
}

describe('buildPaymentOrdersListAggregateParams', () => {
  it('프로그램 groupBy + 검색어', () => {
    expect(
      buildPaymentOrdersListAggregateParams('program', {
        ...emptyFilters,
        programName: 'JA',
      })
    ).toEqual({ groupBy: 'program', search: 'JA' })
  })

  it('캘린더 뷰에서만 statementStatus를 보낸다', () => {
    expect(
      buildPaymentOrdersListAggregateParams('instructor', {
        ...emptyFilters,
        instructorName: '김',
        processingStatus: 'confirmed',
        viewMode: 'calendar',
      })
    ).toEqual({ groupBy: 'instructor', search: '김', statementStatus: 'CONFIRMED' })
  })

  it('리스트 뷰에서만 pendingItemBucket을 보낸다', () => {
    expect(
      buildPaymentOrdersListAggregateParams('program', {
        ...emptyFilters,
        pendingItemBucket: '1_5',
        viewMode: 'list',
      })
    ).toEqual({ groupBy: 'program', pendingItemBucket: '1_5' })
  })

  it('리스트 뷰에서는 처리 현황을 statementStatus로 보내지 않는다', () => {
    expect(
      buildPaymentOrdersListAggregateParams('program', {
        ...emptyFilters,
        processingStatus: 'confirmed',
        viewMode: 'list',
      })
    ).toEqual({ groupBy: 'program' })
  })

  it('기간 필터', () => {
    expect(
      buildPaymentOrdersListAggregateParams('program', {
        ...emptyFilters,
        dateRange: [dayjs('2026-08-01'), dayjs('2026-09-01')],
      })
    ).toEqual({
      groupBy: 'program',
      fromDate: '2026-08-01',
      toDate: '2026-09-01',
    })
  })
})
