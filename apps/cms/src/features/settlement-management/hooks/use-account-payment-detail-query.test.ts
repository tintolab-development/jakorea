import { describe, expect, it } from 'vitest'
import { discardAccountPaymentPlaintextCache } from '@/features/settlement-management/api/clear-settlement-query-cache'
import { settlementQueryKeys } from '@/features/settlement-management/api/settlement-query-keys'
import { accountPaymentDetailQueryOptions } from '@/features/settlement-management/hooks/use-account-payment-detail-query'
import type { AccountPaymentRow } from '@/features/settlement-management/model/account-payments-list'
import { queryClient } from '@/shared/lib/query-client'

const row: AccountPaymentRow = {
  id: 'row-1',
  accountPaymentId: 1,
  no: 1,
  instructorName: '강사',
  programName: '프로그램',
  institutionName: '',
  sessionLabel: '1차시',
  accountPaymentStatus: 'awaiting_confirmation',
  amount: 1,
  transferScheduledDate: '2026-10-26',
  paymentOrderStatus: 'confirmed',
}

describe('account payment plaintext cache', () => {
  it('does not reuse a cached detail after discard', () => {
    const key = settlementQueryKeys.accountPayments.detail('row-1')
    queryClient.setQueryData(key, { basic: { phoneDisplay: '010-1234-5678' } })
    discardAccountPaymentPlaintextCache()
    expect(queryClient.getQueryData(key)).toBeUndefined()
  })

  it('does not keep plaintext with a long gcTime', () => {
    const options = accountPaymentDetailQueryOptions(row)
    expect(options.staleTime).toBe(0)
    expect(options.gcTime).toBe(0)
  })
})
