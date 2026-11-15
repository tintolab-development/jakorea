/** @vitest-environment jsdom */
import { act, renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const bulkConfirmMock = vi.fn()
vi.mock('@/features/settlement-management/api/settlement-api-client', () => ({
  bulkConfirmPaymentStatementsRemote: (...args: unknown[]) => bulkConfirmMock(...args),
  approveSettlementCorrectionRemote: vi.fn(),
  rejectPaymentStatementRemote: vi.fn(),
  rejectSettlementCorrectionRemote: vi.fn(),
}))
vi.mock('@/features/settlement-management/api/invalidate-settlement-ledger-caches', () => ({
  invalidateSettlementLedgerCaches: vi.fn(async () => {}),
}))

import { useConfirmPaymentStatementMutation } from './use-confirm-payment-statement-mutation'

function setup() {
  const queryClient = new QueryClient()
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
  return renderHook(() => useConfirmPaymentStatementMutation(), { wrapper })
}

describe('useConfirmPaymentStatementMutation — 영수증 일괄 승인 함께 보내기', () => {
  beforeEach(() => {
    bulkConfirmMock.mockReset()
    bulkConfirmMock.mockResolvedValue(undefined)
  })

  it('강사 지급조서와 영수증을 일괄 확인 API 한 번으로 보낸다', async () => {
    const { result } = setup()
    await act(async () => {
      await result.current.mutateAsync({
        statementIds: [101],
        lectureFeePaymentScheduledDate: '2026-12-15',
        individualSettlementApplications: [{ settlementApplicationId: 18, expectedRevisionNo: 1 }],
      })
    })
    expect(bulkConfirmMock).toHaveBeenCalledTimes(1)
    expect(bulkConfirmMock).toHaveBeenCalledWith(
      expect.objectContaining({
        statementIds: [101],
        individualSettlementApplications: [{ settlementApplicationId: 18, expectedRevisionNo: 1 }],
        scheduledPaymentDate: '2026-12-15',
      })
    )
  })

  it('영수증만 있어도 보낸다(statementIds 빈 배열)', async () => {
    const { result } = setup()
    await act(async () => {
      await result.current.mutateAsync({
        statementIds: [],
        lectureFeePaymentScheduledDate: '2026-12-15',
        individualSettlementApplications: [{ settlementApplicationId: 19, expectedRevisionNo: 1 }],
      })
    })
    expect(bulkConfirmMock).toHaveBeenCalledWith(
      expect.objectContaining({ statementIds: [], individualSettlementApplications: [expect.anything()] })
    )
  })

  it('확정 전 강사 신청서는 settlementApplicationId만 보내고 revision은 넣지 않는다', async () => {
    const { result } = setup()
    await act(async () => {
      await result.current.mutateAsync({
        statementIds: [],
        lectureFeePaymentScheduledDate: '2026-11-20',
        instructorSettlementApplications: [{ settlementApplicationId: 25 }],
      })
    })
    const body = bulkConfirmMock.mock.calls[0][0] as Record<string, unknown>
    expect(body.instructorSettlementApplications).toEqual([{ settlementApplicationId: 25 }])
    expect(body).not.toHaveProperty('individualSettlementApplications')
    expect(JSON.stringify(body)).not.toContain('expectedRevisionNo')
    expect(body.reason).toBe('지급조서 확인')
  })

  it('강사·영수증 모두 없으면 호출하지 않고, 영수증이 없으면 필드를 보내지 않는다', async () => {
    const { result } = setup()
    await act(async () => {
      await result.current.mutateAsync({ statementIds: [] })
    })
    expect(bulkConfirmMock).not.toHaveBeenCalled()

    await act(async () => {
      await result.current.mutateAsync({ statementIds: [7], lectureFeePaymentScheduledDate: '2026-12-15' })
    })
    expect(bulkConfirmMock.mock.calls[0][0]).not.toHaveProperty('individualSettlementApplications')
  })
})
