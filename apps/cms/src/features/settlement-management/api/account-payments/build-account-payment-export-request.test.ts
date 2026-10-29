import { describe, expect, it } from 'vitest'
import {
  ACCOUNT_PAYMENT_EXPORT_STATUS_PAID,
  ACCOUNT_PAYMENT_EXPORT_STATUS_WAITING_PAYMENT,
  buildAccountPaymentExportRequest,
  buildRawAccountPaymentExportRequest,
} from './build-account-payment-export-request'

describe('buildAccountPaymentExportRequest', () => {
  it('대량이체는 WAITING_PAYMENT와 선택한 settlement/accountPayment ID만 전송한다', () => {
    const body = buildAccountPaymentExportRequest({
      kind: 'bulk-transfer',
      selection: {
        kind: 'selected',
        rows: [
          { settlementId: 101, accountPaymentId: 1001 },
          { settlementId: 101, accountPaymentId: 1002 },
          { settlementId: undefined, accountPaymentId: 2001 },
          { settlementId: undefined, accountPaymentId: 2001 },
        ],
      },
    })
    expect(body.status).toBe(ACCOUNT_PAYMENT_EXPORT_STATUS_WAITING_PAYMENT)
    expect(body.settlementIds).toEqual([101])
    expect(body.accountPaymentIds).toEqual([2001])
  })

  it('전체 발급 의도에서만 두 ID 배열을 비운다', () => {
    const body = buildAccountPaymentExportRequest({
      kind: 'bulk-transfer',
      selection: { kind: 'all' },
    })
    expect(body.settlementIds).toEqual([])
    expect(body.accountPaymentIds).toEqual([])
  })

  it('잘못된 ID 타입·0·안전하지 않은 숫자는 요청에 섞지 않는다', () => {
    const body = buildAccountPaymentExportRequest({
      kind: 'bulk-transfer',
      selection: {
        kind: 'selected',
        rows: [
          { settlementId: 0, accountPaymentId: 2001 },
          { settlementId: Number.MAX_SAFE_INTEGER + 1, accountPaymentId: 2002 },
          { settlementId: undefined, accountPaymentId: '2003' as unknown as number },
          { settlementId: 103, accountPaymentId: 2004 },
        ],
      },
    })
    expect(body.settlementIds).toEqual([103])
    expect(body.accountPaymentIds).toEqual([])
  })

  it('세금신고에는 accountPaymentIds를 포함하지 않는다', () => {
    const body = buildAccountPaymentExportRequest({
      kind: 'tax-report',
      selection: {
        kind: 'selected',
        rows: [{ settlementId: undefined, accountPaymentId: 2001 }, { settlementId: 102 }],
      },
    })
    expect(body.status).toBe(ACCOUNT_PAYMENT_EXPORT_STATUS_PAID)
    expect(body.settlementIds).toEqual([102])
    expect('accountPaymentIds' in body).toBe(false)
  })

  it('이체 기간이 있으면 fromDate/toDate를 포함한다', () => {
    const body = buildAccountPaymentExportRequest({
      kind: 'tax-report',
      selection: { kind: 'all' },
      fromDate: '2026-08-01',
      toDate: '2026-08-31',
    })
    expect(body.fromDate).toBe('2026-08-01')
    expect(body.toDate).toBe('2026-08-31')
    expect(body.dateRangeValid).toBe(true)
    expect(body.reason).toContain('세금신고')
  })

  it('마스킹 발급은 원본 승인을 넣지 않는다', () => {
    const body = buildAccountPaymentExportRequest({
      kind: 'bulk-transfer',
      selection: { kind: 'selected', rows: [{ settlementId: 1, accountPaymentId: 2 }] },
    })
    expect(body.rawPrivacyIncluded).toBe(false)
    expect(body.approvalReference).toBeUndefined()
  })
})

describe('buildRawAccountPaymentExportRequest', () => {
  it('승인 reference와 기간 필터 전체 범위로 원본 export를 만든다', () => {
    const body = buildRawAccountPaymentExportRequest({
      kind: 'tax-report',
      approvalReference: 'apr-1',
      fromDate: '2026-01-01',
      toDate: '2026-12-31',
    })
    expect(body.rawPrivacyIncluded).toBe(true)
    expect(body.exportPolicy).toBe('RAW_PRIVACY_APPROVAL_REQUIRED')
    expect(body.approvalReference).toBe('apr-1')
    expect(body.programId).toBeUndefined()
    expect(body.settlementIds).toEqual([])
    expect(body.accountPaymentIds).toEqual([])
    expect(body.status).toBe(ACCOUNT_PAYMENT_EXPORT_STATUS_PAID)
  })

  it('승인 reference가 없으면 요청을 만들지 않는다', () => {
    expect(() =>
      buildRawAccountPaymentExportRequest({
        kind: 'bulk-transfer',
        approvalReference: '  ',
      })
    ).toThrow(/승인 reference/)
  })
})
