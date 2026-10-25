import { describe, expect, it } from 'vitest'
import type { IndividualSettlementReviewListItem } from '@/shared/api/generated/dashboard/schemas/individualSettlementReviewListItem'
import { INDIVIDUAL_SETTLEMENT_APPLICATION_SOURCE_TYPE } from './payment-order-individual-source'
import {
  mapPaymentOrderIndividualRows,
  sumPaymentOrderIndividualAmounts,
} from './map-payment-order-individual-rows'

const submitted: IndividualSettlementReviewListItem = {
  settlementApplicationId: 1,
  programId: 186304,
  individualApplicationId: 1694686,
  participantId: 1694942,
  memberId: 190080,
  programScheduleId: 187231,
  scheduleName: '1회차',
  latestRevisionNo: 1,
  status: 'SUBMITTED',
  totalAmount: 49999,
}

describe('mapPaymentOrderIndividualRows', () => {
  it('keeps individual sourceType and settlementApplicationId, not settlementId', () => {
    const rows = mapPaymentOrderIndividualRows([
      submitted,
      { ...submitted, settlementApplicationId: 2, status: 'DRAFT', totalAmount: 1000 },
      { ...submitted, settlementApplicationId: 3, status: 'APPROVED', totalAmount: 2000 },
    ])
    expect(rows.map(row => row.settlementApplicationId)).toEqual([1, 3])
    expect(rows.every(row => row.sourceType === INDIVIDUAL_SETTLEMENT_APPLICATION_SOURCE_TYPE)).toBe(
      true
    )
    expect(rows.every(row => !('settlementId' in row))).toBe(true)
    expect(rows.every(row => !('statementId' in row))).toBe(true)
    expect(rows[0]?.statusLabel).toBe('확인 대기 중')
    expect(rows[1]?.statusLabel).toBe('영수증 확인 완료')
    expect(sumPaymentOrderIndividualAmounts(rows)).toBe(51999)
  })
})
