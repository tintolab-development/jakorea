import { describe, expect, it } from 'vitest'
import { mapAccountPaymentListItemToRow } from './map-account-payment-rows'
import { buildSettlementByIdMap } from './map-settlement-context'
import type {
  AccountPaymentListItemResponse,
  SettlementListItemResponse,
} from '@/shared/api/generated/settlement/schemas'

describe('mapAccountPaymentListItemToRow', () => {
  it('join된 정산 라인의 institutionName·sessionOrdinal을 사용', () => {
    const settlements: SettlementListItemResponse[] = [
      {
        settlementId: 1001,
        programNameKo: 'JA 경제교실',
        instructorName: '홍길동',
        institutionName: '○○초등학교',
        sessionOrdinal: 3,
        scheduleId: 88001,
      },
    ]
    const payment: AccountPaymentListItemResponse = {
      accountPaymentId: 11,
      settlementId: 1001,
      instructorName: '홍길동',
      netPaymentAmount: 915000,
      paymentStatus: 'PENDING',
    }

    const row = mapAccountPaymentListItemToRow(
      payment,
      0,
      buildSettlementByIdMap(settlements)
    )

    expect(row.institutionName).toBe('○○초등학교')
    expect(row.sessionLabel).toBe('3차시')
    expect(row.sessionLabel).not.toBe('88001차시')
  })
})
