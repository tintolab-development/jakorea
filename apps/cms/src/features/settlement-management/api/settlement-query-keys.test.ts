import { describe, expect, it } from 'vitest'
import { settlementQueryKeys } from './settlement-query-keys'

function isPrefixedBy(key: readonly unknown[], prefix: readonly unknown[]): boolean {
  return prefix.every((part, index) => key[index] === part)
}

describe('settlement mutation invalidate prefixes', () => {
  it('account payment lists/details do not match exports', () => {
    const lists = settlementQueryKeys.accountPayments.lists()
    const details = settlementQueryKeys.accountPayments.details()
    const exports = settlementQueryKeys.accountPayments.exports()

    expect(isPrefixedBy(settlementQueryKeys.accountPayments.list('q'), lists)).toBe(true)
    expect(isPrefixedBy(settlementQueryKeys.accountPayments.detail('row-1'), details)).toBe(true)
    expect(isPrefixedBy(exports, lists)).toBe(false)
    expect(isPrefixedBy(exports, details)).toBe(false)
    expect(isPrefixedBy(exports, settlementQueryKeys.accountPayments.all())).toBe(true)
  })

  it('payment order lists/details do not match settlement subresources', () => {
    const lists = settlementQueryKeys.paymentOrders.lists()
    const details = settlementQueryKeys.paymentOrders.details()
    const settlement = settlementQueryKeys.paymentOrders.settlement(9)

    expect(isPrefixedBy(settlementQueryKeys.paymentOrders.list('q'), lists)).toBe(true)
    expect(isPrefixedBy(settlementQueryKeys.paymentOrders.detail('program', 'k'), details)).toBe(
      true
    )
    expect(isPrefixedBy(settlement, lists)).toBe(false)
    expect(isPrefixedBy(settlement, details)).toBe(false)
  })
})
