import { describe, expect, it } from 'vitest'
import { readSettlementBulkConfirmResult } from './read-bulk-confirm-result'

describe('readSettlementBulkConfirmResult', () => {
  it('강사 결과 배열이 없거나 null이면 []로 읽는다', () => {
    expect(readSettlementBulkConfirmResult(undefined).instructorSettlementApplicationResults).toEqual([])
    expect(readSettlementBulkConfirmResult(null).individualSettlementApplicationResults).toEqual([])
    expect(
      readSettlementBulkConfirmResult({
        results: undefined,
        individualSettlementApplicationResults: null as never,
        instructorSettlementApplicationResults: null as never,
      }).instructorSettlementApplicationResults,
    ).toEqual([])
  })

  it('강사 신청서만 성공하면 results는 []이고 강사 결과만 채운다', () => {
    const read = readSettlementBulkConfirmResult({
      statusAxis: 'PAYMENT_STATEMENT',
      toStatus: 'CONFIRMED',
      requestedCount: 1,
      successCount: 1,
      results: [],
      individualSettlementApplicationResults: [],
      instructorSettlementApplicationResults: [
        {
          applicationId: 25,
          status: 'CONFIRMED',
          settlementId: 10,
          paymentStatementId: 11,
          message: undefined,
          availableActions: [],
        },
      ],
    })
    expect(read.results).toEqual([])
    expect(read.requestedCount).toBe(read.successCount)
    expect(read.instructorSettlementApplicationResults?.[0]?.status).toBe('CONFIRMED')
  })
})
