/** @vitest-environment jsdom */
import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const fetchMock = vi.fn()

vi.mock('@/features/settlement-management/api/settlement-api-client', () => ({
  fetchSettlementBudgetSummaryRemote: (...args: unknown[]) => fetchMock(...args),
}))

vi.mock('@/features/settlement-management/hooks/use-settlement-remote-enabled', () => ({
  useSettlementRemoteEnabled: () => true,
}))

import { useSettlementBudgetSummaryQuery } from './use-settlement-budget-summary-query'

function summary(year: number, annualBudgetAmount: number, completedNetTotal: number) {
  return { year, annualBudgetAmount, completedNetTotal, expectedSettlementAmount: annualBudgetAmount }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(done => {
    resolve = done
  })
  return { promise, resolve }
}

function setup(initialYear: number) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
  return renderHook(
    ({ year }: { year: number }) =>
      useSettlementBudgetSummaryQuery({
        year,
        fromDate: `${year}-11-01`,
        toDate: `${year}-12-01`,
      }),
    { wrapper, initialProps: { year: initialYear } }
  )
}

describe('useSettlementBudgetSummaryQuery 연도 전환', () => {
  beforeEach(() => {
    fetchMock.mockReset()
  })

  it('연도 키가 바뀌는 동안 이전 금액을 유지하고 isLoading으로 비우지 않는다', async () => {
    const next = deferred<ReturnType<typeof summary>>()
    fetchMock.mockImplementation((params: { year?: number }) => {
      if (params.year === 2026) return Promise.resolve(summary(2026, 1_000, 200))
      return next.promise
    })

    const { result, rerender } = setup(2026)

    await waitFor(() => expect(result.current.data?.annualBudgetAmount).toBe(1_000))

    rerender({ year: 2025 })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.isPlaceholderData).toBe(true)
    expect(result.current.data?.annualBudgetAmount).toBe(1_000)
    expect(result.current.data?.completedNetTotal).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock).toHaveBeenLastCalledWith({
      year: 2025,
      fromDate: '2025-11-01',
      toDate: '2025-12-01',
    })

    await act(async () => {
      next.resolve(summary(2025, 3_000, 400))
    })

    await waitFor(() => expect(result.current.isPlaceholderData).toBe(false))
    expect(result.current.isLoading).toBe(false)
    expect(result.current.data?.annualBudgetAmount).toBe(3_000)
    expect(result.current.data?.completedNetTotal).toBe(400)
  })
})
