import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DETAILED_PROGRAM_BULK_MAX } from '@/features/detailed-program/lib/bulk-update'

const bulkDelete3 = vi.fn()
const bulkUpdateDetailedPrograms = vi.fn()

vi.mock('@/features/data-management/api/data-management-subset-api', () => ({
  getDataManagementSubsetApi: () => ({
    bulkDelete3,
    bulkUpdateDetailedPrograms,
  }),
}))

vi.mock('@/features/data-management/api/unwrap-api-body', () => ({
  unwrapApiBody: <T,>(payload: T) => payload,
}))

describe('detailed-programs-api-client bulk contracts', () => {
  beforeEach(() => {
    bulkDelete3.mockReset()
    bulkUpdateDetailedPrograms.mockReset()
  })

  it('sends bulk-delete in one request without 100-item chunks', async () => {
    const { bulkDeleteDetailedProgramsRemote } = await import('./detailed-programs-api-client')
    const ids = Array.from({ length: 250 }, (_, i) => String(i + 1))
    bulkDelete3.mockResolvedValue({ failureCount: 0, failures: [] })
    await bulkDeleteDetailedProgramsRemote(ids)
    expect(bulkDelete3).toHaveBeenCalledTimes(1)
    expect(bulkDelete3.mock.calls[0]?.[0]?.ids).toHaveLength(250)
  })

  it('does not split bulk-update and rejects over 500', async () => {
    const { bulkUpdateDetailedProgramsRemote } = await import('./detailed-programs-api-client')
    const items = Array.from({ length: DETAILED_PROGRAM_BULK_MAX + 1 }, (_, i) => ({
      id: i + 1,
      nameKo: `N${i}`,
      useYn: true,
      version: 1,
    }))
    await expect(bulkUpdateDetailedProgramsRemote(items)).rejects.toThrow('500')
    expect(bulkUpdateDetailedPrograms).not.toHaveBeenCalled()
  })
})
