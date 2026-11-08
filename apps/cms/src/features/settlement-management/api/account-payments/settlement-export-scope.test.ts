import { describe, expect, it } from 'vitest'
import { isUnfilteredFullRawExportBody } from './build-account-payment-export-request'
import {
  assertUsableScopeToken,
  buildFullCorpusScopeRequest,
  buildRawExportBodyForScope,
  buildSelectedScopeRequest,
  isScopeExpired,
} from './settlement-export-scope'

describe('settlement export scope', () => {
  it('전체 범위 확인 body에 상태·기간·선택 ID를 넣지 않는다', () => {
    const body = buildFullCorpusScopeRequest('bulk-transfer')
    expect(body.settlementIds).toEqual([])
    expect(body.accountPaymentIds).toEqual([])
    expect(body.status).toBeUndefined()
    expect(body.fromDate).toBeUndefined()
    expect(body.programId).toBeUndefined()
  })

  it('세금신고 전체 범위 확인에는 accountPaymentIds를 넣지 않는다', () => {
    const body = buildFullCorpusScopeRequest('tax-report')
    expect(body.settlementIds).toEqual([])
    expect(body.accountPaymentIds).toBeUndefined()
  })

  it('선택 범위는 선택한 원장 ID만 넣고 클라이언트 해시는 만들지 않는다', () => {
    const body = buildSelectedScopeRequest({
      kind: 'bulk-transfer',
      rows: [
        { settlementId: 11, accountPaymentId: 101 },
        { settlementId: undefined, accountPaymentId: 202 },
      ],
    })
    expect(body.settlementIds).toEqual([11])
    expect(body.accountPaymentIds).toEqual([202])
    expect(body.status).toBeUndefined()
    expect('searchSnapshotHash' in body).toBe(false)
  })

  it('만료·빈 토큰은 선택 원본에 쓰지 않는다', () => {
    expect(() => assertUsableScopeToken({})).toThrow(/scopeToken/)
    expect(
      isScopeExpired({ expiresAtEpochSecond: 1 }, 2)
    ).toBe(true)
    expect(assertUsableScopeToken({ scopeToken: 'tok', expiresAtEpochSecond: 9_999_999_999 })).toBe(
      'tok'
    )
  })

  it('전체 원본 export body는 승인 reference만 있고 무필터다', () => {
    const body = buildRawExportBodyForScope({
      kind: 'tax-report',
      approvalReference: 'ref-1',
      fullCorpus: true,
    })
    expect(isUnfilteredFullRawExportBody(body)).toBe(true)
  })
})
