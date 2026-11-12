/** @vitest-environment jsdom */
import { createElement, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const { getScheduleEventsMock } = vi.hoisted(() => ({ getScheduleEventsMock: vi.fn() }))

vi.mock('@/features/dashboard/api/admin-dashboard-service', async importOriginal => ({
  ...(await importOriginal<typeof import('@/features/dashboard/api/admin-dashboard-service')>()),
  getDashboardScheduleEvents: getScheduleEventsMock,
}))

vi.mock('@/features/dashboard/hooks/use-dashboard-query-scope', () => ({
  useDashboardRemoteQueryEnabled: (enabled = true) => enabled,
}))

import { useDashboardProgramSchedules } from '@/features/dashboard/hooks/use-dashboard-program-schedules'

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return createElement(QueryClientProvider, { client }, children)
}

describe('useDashboardProgramSchedules (QA-0382)', () => {
  it('운영·모집 일정을 함께 요청한다', async () => {
    getScheduleEventsMock.mockResolvedValue([])
    const { result } = renderHook(
      () =>
        useDashboardProgramSchedules({
          dateFrom: '2026-11-01',
          dateTo: '2026-11-30',
          programType: 'general',
        }),
      { wrapper }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(getScheduleEventsMock).toHaveBeenCalledWith(
      expect.objectContaining({ includeOperationalEvents: true, programType: 'general' })
    )
  })
})
