import { describe, expect, it } from 'vitest'
import dayjs from 'dayjs'
import { buildPaymentOrdersListAggregateParams } from './build-payment-orders-list-aggregate-params'

describe('buildPaymentOrdersListAggregateParams', () => {
  it('프로그램 groupBy + 검색어', () => {
    expect(
      buildPaymentOrdersListAggregateParams('program', {
        programName: 'JA',
        instructorName: '',
        processingStatus: 'all',
        dateRange: null,
      })
    ).toEqual({ groupBy: 'program', search: 'JA' })
  })

  it('강사 groupBy + statementStatus', () => {
    expect(
      buildPaymentOrdersListAggregateParams('instructor', {
        programName: '',
        instructorName: '김',
        processingStatus: 'confirmed',
        dateRange: null,
      })
    ).toEqual({ groupBy: 'instructor', search: '김', statementStatus: 'CONFIRMED' })
  })

  it('기간 필터', () => {
    expect(
      buildPaymentOrdersListAggregateParams('program', {
        programName: '',
        instructorName: '',
        processingStatus: 'all',
        dateRange: [dayjs('2026-08-01'), dayjs('2026-09-01')],
      })
    ).toEqual({
      groupBy: 'program',
      fromDate: '2026-08-01',
      toDate: '2026-09-01',
    })
  })
})
