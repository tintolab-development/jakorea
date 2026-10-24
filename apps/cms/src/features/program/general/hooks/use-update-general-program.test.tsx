/** @vitest-environment jsdom */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { ReactNode } from 'react'
import type { Program } from '@/types/domain'
import { generalProgramQueryKeys } from '@/features/program/general/api/general-program-query-keys'
import { useUpdateGeneralProgram } from './use-update-general-program'

vi.mock('@/features/program/general/api/admin-general-programs-service', () => ({
  updateGeneralProgram: vi.fn(),
}))

vi.mock('@/features/program/shared/lib/invalidate-program-list-caches-after-registration', () => ({
  invalidateGeneralProgramListCaches: vi.fn(),
}))

import { updateGeneralProgram } from '@/features/program/general/api/admin-general-programs-service'

const program = {
  id: '186304',
  sponsorId: '1627251',
  title: '일반',
  type: 'offline',
  format: 'workshop',
  category: 'school',
  description: '',
  rounds: [],
  startDate: '2026-04-01T00:00:00.000Z',
  endDate: '2026-12-31T00:00:00.000Z',
  status: 'pending',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
} as Program

describe('useUpdateGeneralProgram', () => {
  beforeEach(() => {
    vi.mocked(updateGeneralProgram).mockReset()
  })

  it('SP-FE-09 저장 성공 후 상세·assignment 만 targeted invalidate 한다', async () => {
    vi.mocked(updateGeneralProgram).mockResolvedValue({ ...program, title: '저장됨' })
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const detailKey = generalProgramQueryKeys.detail('186304')
    const assignmentsKey = generalProgramQueryKeys.sponsorAssignments('186304')
    const catalogKey = ['sponsors', 'list'] as const
    queryClient.setQueryData(detailKey, program)
    queryClient.setQueryData(assignmentsKey, [{ sponsorId: '1627251' }])
    queryClient.setQueryData(catalogKey, [{ id: '1627251' }])
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    const { result } = renderHook(() => useUpdateGeneralProgram(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync({
        programId: '186304',
        program,
        patch: { generalCommonInfo: { sponsorManagementIds: ['1627251'] } },
      })
    })
    await waitFor(() => {
      expect(invalidate).toHaveBeenCalled()
    })
    const invalidated = invalidate.mock.calls.map(call => JSON.stringify(call[0]?.queryKey ?? call[0]))
    expect(invalidated.some(key => key.includes('"detail","186304"'))).toBe(true)
    expect(invalidated.some(key => key.includes('"sponsor-assignments","186304"'))).toBe(true)
    expect(invalidated.some(key => key.includes('"sponsors"') && key.includes('"list"'))).toBe(
      false
    )
    queryClient.clear()
  })

  it('실패 시 상세·assignment 를 invalidate 하지 않는다', async () => {
    vi.mocked(updateGeneralProgram).mockRejectedValue(new Error('fail'))
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    const { result } = renderHook(() => useUpdateGeneralProgram(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync({ programId: '186304', program }).catch(() => undefined)
    })
    expect(vi.mocked(updateGeneralProgram)).toHaveBeenCalledTimes(1)
    expect(invalidate).not.toHaveBeenCalled()
    queryClient.clear()
  })
})
