import { describe, expect, it } from 'vitest'
import { settlementQueryKeys } from './settlement-query-keys'

function isPrefixedBy(key: readonly unknown[], prefix: readonly unknown[]): boolean {
  return prefix.every((part, index) => key[index] === part)
}

describe('settlement mutation invalidate prefixes', () => {
  it('account payment lists/details/budgetSummary share accountPayments root', () => {
    const lists = settlementQueryKeys.accountPayments.lists()
    const details = settlementQueryKeys.accountPayments.details()
    const budget = settlementQueryKeys.accountPayments.budgetSummary(2026)

    expect(isPrefixedBy(settlementQueryKeys.accountPayments.list('q'), lists)).toBe(true)
    expect(isPrefixedBy(settlementQueryKeys.accountPayments.detail('row-1'), details)).toBe(true)
    expect(isPrefixedBy(budget, settlementQueryKeys.accountPayments.all())).toBe(true)
    expect(isPrefixedBy(budget, lists)).toBe(false)
    expect(isPrefixedBy(budget, details)).toBe(false)
  })

  it('payment order lists/details do not match settlement subresources', () => {
    const lists = settlementQueryKeys.paymentOrders.lists()
    const details = settlementQueryKeys.paymentOrders.details()
    const settlement = settlementQueryKeys.paymentOrders.settlement(9)

    expect(isPrefixedBy(settlementQueryKeys.paymentOrders.list('program', 'q'), lists)).toBe(true)
    expect(isPrefixedBy(settlementQueryKeys.paymentOrders.list('instructor', 'q'), lists)).toBe(
      true
    )
    expect(settlementQueryKeys.paymentOrders.list('program', 'q')).not.toEqual(
      settlementQueryKeys.paymentOrders.list('instructor', 'q')
    )
    expect(isPrefixedBy(settlementQueryKeys.paymentOrders.detail('program', 'k'), details)).toBe(
      true
    )
    expect(
      isPrefixedBy(settlementQueryKeys.paymentOrders.detail('program', 'k', '2026-01-01_2026-01-31'), details)
    ).toBe(true)
    expect(isPrefixedBy(settlement, lists)).toBe(false)
    expect(isPrefixedBy(settlement, details)).toBe(false)
  })
})
