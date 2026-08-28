import { describe, expect, it } from 'vitest'
import {
  ACCOUNT_PAYMENT_EXPORT_STATUS_PAID,
  buildAccountPaymentExportRequest,
} from './build-account-payment-export-request'

describe('buildAccountPaymentExportRequest', () => {
  it('status는 항상 PAID', () => {
    const body = buildAccountPaymentExportRequest({ kind: 'bulk-transfer' })
    expect(body.status).toBe(ACCOUNT_PAYMENT_EXPORT_STATUS_PAID)
    expect(body.status).toBe('PAID')
  })

  it('이체 기간이 있으면 fromDate/toDate를 포함한다', () => {
    const body = buildAccountPaymentExportRequest({
      kind: 'tax-report',
      fromDate: '2026-08-01',
      toDate: '2026-08-31',
    })
    expect(body.fromDate).toBe('2026-08-01')
    expect(body.toDate).toBe('2026-08-31')
    expect(body.dateRangeValid).toBe(true)
    expect(body.reason).toContain('세금신고')
  })
})
