import { describe, expect, it } from 'vitest'
import {
  applyBulkTransferWithholdingAmounts,
  withholdingTaxAmountFromSettlementDetail,
} from './bulk-transfer-withholding'
import type { AccountPaymentRow } from '@/features/settlement-management/model/account-payments-list'

describe('withholdingTaxAmountFromSettlementDetail', () => {
  it('withholding 항목만 절대값으로 합산한다', () => {
    expect(
      withholdingTaxAmountFromSettlementDetail({
        items: [
          { type: 'instructor_fee', amount: 240_000 },
          { type: 'withholding', amount: -7_920 },
          { type: 'withholding', amount: 0 },
        ],
      })
    ).toBe(7_920)
  })

  it('withholding이 없으면 0이다', () => {
    expect(
      withholdingTaxAmountFromSettlementDetail({
        items: [{ type: 'activity', amount: 50_000 }],
      })
    ).toBe(0)
  })
})

describe('applyBulkTransferWithholdingAmounts', () => {
  it('정산 ID에 매핑된 세액만 붙인다', () => {
    const rows: AccountPaymentRow[] = [
      {
        id: 'ap-1',
        settlementId: 11,
        no: 1,
        instructorName: 'A',
        programName: 'P',
        institutionName: 'I',
        sessionLabel: '1차시',
        accountPaymentStatus: 'awaiting_confirmation',
        amount: 100_000,
        transferScheduledDate: '2026-10-26',
        paymentOrderStatus: 'confirmed',
      },
      {
        id: 'ap-2',
        no: 2,
        instructorName: 'B',
        programName: 'P',
        institutionName: 'I',
        sessionLabel: '1차시',
        accountPaymentStatus: 'awaiting_confirmation',
        amount: 50_000,
        transferScheduledDate: '2026-10-26',
        paymentOrderStatus: 'confirmed',
      },
    ]
    const applied = applyBulkTransferWithholdingAmounts(rows, new Map([[11, 3300]]))
    expect(applied[0]?.withholdingTaxAmount).toBe(3300)
    expect(applied[1]?.withholdingTaxAmount).toBeUndefined()
  })
})
