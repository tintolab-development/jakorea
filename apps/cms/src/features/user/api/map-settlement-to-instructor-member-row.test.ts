import { describe, expect, it } from 'vitest'
import { resolveSettlementUiStatus } from './map-settlement-to-instructor-member-row'
import type { SettlementListItemResponse } from '@/shared/api/generated/settlement/schemas'

function item(
  partial: Partial<SettlementListItemResponse> = {}
): SettlementListItemResponse {
  return {
    settlementId: 1,
    ...partial,
  }
}

describe('resolveSettlementUiStatus', () => {
  it('maps REAPPLICATION statement to payment_statement_reapplication', () => {
    expect(
      resolveSettlementUiStatus(item({ statementStatus: 'REAPPLICATION', paymentStatus: 'REQUESTED' }))
    ).toBe('payment_statement_reapplication')
  })

  it('maps PARTIAL statement to partial_confirmation', () => {
    expect(
      resolveSettlementUiStatus(item({ statementStatus: 'PARTIAL', paymentStatus: 'REQUESTED' }))
    ).toBe('partial_confirmation')
  })

  it('maps CONFIRMED + WAITING_PAYMENT to awaiting_confirmation', () => {
    expect(
      resolveSettlementUiStatus(
        item({ statementStatus: 'CONFIRMED', paymentStatus: 'WAITING_PAYMENT' })
      )
    ).toBe('awaiting_confirmation')
  })

  it('maps PAID payment to account_paid', () => {
    expect(resolveSettlementUiStatus(item({ paymentStatus: 'PAID' }))).toBe('account_paid')
  })
})
