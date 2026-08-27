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

  it('paymentOrders.all() prefixes list, detail, and settlement calc', () => {
    const all = settlementQueryKeys.paymentOrders.all()
    expect(isPrefixedBy(settlementQueryKeys.paymentOrders.list('program', 'q'), all)).toBe(true)
    expect(isPrefixedBy(settlementQueryKeys.paymentOrders.detail('program', 'k'), all)).toBe(true)
    expect(isPrefixedBy(settlementQueryKeys.paymentOrders.settlement(170601), all)).toBe(true)
  })
})
