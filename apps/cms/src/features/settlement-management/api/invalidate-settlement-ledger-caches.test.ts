import { describe, expect, it, vi } from 'vitest'
import type { QueryClient } from '@tanstack/react-query'
import { invalidateSettlementLedgerCaches } from './invalidate-settlement-ledger-caches'
import { settlementQueryKeys } from './settlement-query-keys'

describe('invalidateSettlementLedgerCaches', () => {
  it('지급조서·캘린더·계좌 지급(목록·상세·예산)을 함께 무효화한다', async () => {
    const invalidateQueries = vi.fn().mockResolvedValue(undefined)
    const queryClient = { invalidateQueries } as unknown as QueryClient

    await invalidateSettlementLedgerCaches(queryClient)

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: settlementQueryKeys.paymentOrders.all(),
    })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: settlementQueryKeys.calendar.all(),
    })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: settlementQueryKeys.accountPayments.lists(),
    })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: settlementQueryKeys.accountPayments.details(),
    })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: [...settlementQueryKeys.accountPayments.all(), 'budgetSummary'],
    })
    expect(invalidateQueries).toHaveBeenCalledTimes(5)
  })
})
