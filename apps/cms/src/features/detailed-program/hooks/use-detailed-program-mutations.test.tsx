// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { dataManagementQueryKeys as keys } from '@/features/data-management/api/data-management-query-keys'
import { useDetailedProgramMutations } from './use-detailed-program-mutations'

const api = vi.hoisted(() => ({
  createDetailedProgram: vi.fn(),
  bulkUpdateDetailedPrograms: vi.fn(),
  bulkChangeDetailedPrograms: vi.fn(),
  deleteDetailedPrograms: vi.fn(),
}))
vi.mock('@/features/detailed-program/api/admin-detailed-programs-service', () => api)

describe('detailed program selector cache', () => {
  it('invalidates only the selector after every mutation, preserving other master caches', async () => {
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
    const options = keys.detailedPrograms.options()
    const areas = keys.textbooks.businessAreas()
    const row = { id: '1', name: 'example', active: true, createdBy: '', createdAt: '', inUse: false }
    const wrapper = ({ children }: PropsWithChildren) =>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    const { result, unmount } = renderHook(useDetailedProgramMutations, { wrapper })
    const cases = [
      () => result.current.createMutation.mutateAsync({ name: row.name, active: true }),
      () => result.current.bulkUpdateMutation.mutateAsync([]),
      () => result.current.bulkChangesMutation.mutateAsync({ updates: [], deleteItems: [] }),
      () => result.current.deleteMutation.mutateAsync(['1']),
    ]
    api.createDetailedProgram.mockResolvedValue(row)
    api.bulkUpdateDetailedPrograms.mockResolvedValue([])
    api.bulkChangeDetailedPrograms.mockResolvedValue({ updated: [], deletedIds: ['1'] })
    api.deleteDetailedPrograms.mockResolvedValue(undefined)
    try {
      client.setQueryData(areas, [])
      for (const run of cases) {
        client.setQueryData(options, [row])
        await act(async () => { await run() })
        expect(client.getQueryState(options)?.isInvalidated).toBe(true)
        expect(client.getQueryState(areas)?.isInvalidated).toBe(false)
      }
      client.setQueryData(options, [row])
      api.createDetailedProgram.mockRejectedValueOnce(new Error('request failed'))
      await act(async () => {
        await expect(result.current.createMutation.mutateAsync({ name: row.name, active: true })).rejects.toThrow('request failed')
      })
      expect(client.getQueryState(options)?.isInvalidated).toBe(true)
    } finally { unmount(); client.clear() }
  })
})
