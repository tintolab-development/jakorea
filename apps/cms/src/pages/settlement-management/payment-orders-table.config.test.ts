import { describe, expect, it } from 'vitest'
import {
  PAYMENT_ORDERS_DETAIL_KEY_PARAM,
  PAYMENT_ORDERS_DETAIL_NO_PARAM,
  PAYMENT_ORDERS_DETAIL_TYPE_PARAM,
  PAYMENT_ORDERS_EXPOSURE_PARAM_KEY,
  parsePaymentOrdersFiltersFromUrl,
  paymentOrdersListFilterQueryKey,
  paymentOrdersListQuerySearchParamsKey,
} from './payment-orders-table.config'

describe('parsePaymentOrdersFiltersFromUrl', () => {
  it('노출 기준 쿼리가 없으면 프로그램별로 본다', () => {
    const parsed = parsePaymentOrdersFiltersFromUrl(new URLSearchParams())
    expect(parsed.exposureMode).toBe('program')
  })

  it('신청자별 쿼리면 신청자별로 본다', () => {
    const parsed = parsePaymentOrdersFiltersFromUrl(
      new URLSearchParams(`${PAYMENT_ORDERS_EXPOSURE_PARAM_KEY}=instructor`)
    )
    expect(parsed.exposureMode).toBe('instructor')
  })

  it('알 수 없는 노출 기준 쿼리는 프로그램별로 본다', () => {
    const parsed = parsePaymentOrdersFiltersFromUrl(
      new URLSearchParams(`${PAYMENT_ORDERS_EXPOSURE_PARAM_KEY}=unknown`)
    )
    expect(parsed.exposureMode).toBe('program')
  })
})

describe('paymentOrdersListQuerySearchParamsKey', () => {
  it('상세 모달 쿼리를 목록 조회 키에서 제외한다', () => {
    const params = new URLSearchParams(
      `${PAYMENT_ORDERS_EXPOSURE_PARAM_KEY}=program&po_from=2026-08-01&po_to=2026-08-31&${PAYMENT_ORDERS_DETAIL_TYPE_PARAM}=program&${PAYMENT_ORDERS_DETAIL_KEY_PARAM}=12&${PAYMENT_ORDERS_DETAIL_NO_PARAM}=3`
    )
    expect(paymentOrdersListQuerySearchParamsKey(params)).toBe(
      `${PAYMENT_ORDERS_EXPOSURE_PARAM_KEY}=program&po_from=2026-08-01&po_to=2026-08-31`
    )
  })

  it('aggregates 캐시 키에서 노출 기준을 제외한다', () => {
    const withProgram = new URLSearchParams(
      `${PAYMENT_ORDERS_EXPOSURE_PARAM_KEY}=program&po_from=2026-08-01&po_to=2026-08-31`
    )
    const withInstructor = new URLSearchParams(
      `${PAYMENT_ORDERS_EXPOSURE_PARAM_KEY}=instructor&po_from=2026-08-01&po_to=2026-08-31`
    )
    expect(paymentOrdersListFilterQueryKey(withProgram)).toBe(
      paymentOrdersListFilterQueryKey(withInstructor)
    )
    expect(paymentOrdersListFilterQueryKey(withProgram)).toBe(
      'po_from=2026-08-01&po_to=2026-08-31'
    )
  })
})
