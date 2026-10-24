import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DETAILED_PROGRAM_BULK_MAX } from '@/features/detailed-program/lib/bulk-update'

const bulkDelete3 = vi.fn()
const bulkUpdateDetailedPrograms = vi.fn()
const customInstance = vi.fn()

vi.mock('@/features/data-management/api/data-management-subset-api', () => ({
  getDataManagementSubsetApi: () => ({
    bulkDelete3,
    bulkUpdateDetailedPrograms,
  }),
}))

vi.mock('@/shared/api/orval-mutator', () => ({
  customInstance: (...args: unknown[]) => customInstance(...args),
}))

describe('detailed-programs-api-client bulk contracts', () => {
  beforeEach(() => {
    bulkDelete3.mockReset()
    bulkUpdateDetailedPrograms.mockReset()
    customInstance.mockReset()
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

  it('sends mixed updates and deletes in one bulk-changes request', async () => {
    const { bulkChangeDetailedProgramsRemote } = await import('./detailed-programs-api-client')
    customInstance.mockResolvedValue({
      updated: [
        { id: 101, nameKo: 'A', useYn: true, version: 4 },
        { id: 102, nameKo: 'B', useYn: false, version: 6 },
      ],
      deletedIds: [103],
    })
    const result = await bulkChangeDetailedProgramsRemote({
      updates: [
        { id: 101, nameKo: 'A', useYn: true, version: 3 },
        { id: 102, nameKo: 'B', useYn: false, version: 5 },
      ],
      deleteItems: [{ id: 103, version: 2 }],
    })
    expect(customInstance).toHaveBeenCalledTimes(1)
    expect(customInstance.mock.calls[0]?.[0]).toMatchObject({
      url: '/api/admin/detailed-programs/bulk-changes',
      method: 'PATCH',
      data: {
        updates: [
          { id: 101, nameKo: 'A', useYn: true, version: 3 },
          { id: 102, nameKo: 'B', useYn: false, version: 5 },
        ],
        deleteItems: [{ id: 103, version: 2 }],
      },
    })
    expect(customInstance.mock.calls[0]?.[1]).toEqual({ skipGlobalErrorAlert: true })
    expect(bulkUpdateDetailedPrograms).not.toHaveBeenCalled()
    expect(bulkDelete3).not.toHaveBeenCalled()
    expect(result).toEqual({
      updated: [
        { id: 101, nameKo: 'A', useYn: true, version: 4 },
        { id: 102, nameKo: 'B', useYn: false, version: 6 },
      ],
      deletedIds: [103],
    })
  })

  it('unwraps bulk-changes envelope and does not fall back to other bulk APIs on failure', async () => {
    const { bulkChangeDetailedProgramsRemote } = await import('./detailed-programs-api-client')
    customInstance.mockResolvedValueOnce({
      success: true,
      data: {
        updated: [{ id: 101, nameKo: 'A', useYn: true, version: 4 }],
        deletedIds: [103],
      },
    })
    await expect(
      bulkChangeDetailedProgramsRemote({
        updates: [{ id: 101, nameKo: 'A', useYn: true, version: 3 }],
        deleteItems: [{ id: 103, version: 2 }],
      })
    ).resolves.toEqual({
      updated: [{ id: 101, nameKo: 'A', useYn: true, version: 4 }],
      deletedIds: [103],
    })

    customInstance.mockRejectedValueOnce(
      Object.assign(new Error('update failed'), {
        response: { status: 400, data: { error: { code: 'DETAILED_PROGRAM_NAME_KO_REQUIRED' } } },
      })
    )
    await expect(
      bulkChangeDetailedProgramsRemote({
        updates: [{ id: 101, nameKo: 'A', useYn: true, version: 3 }],
        deleteItems: [{ id: 103, version: 2 }],
      })
    ).rejects.toThrow('update failed')
    expect(bulkUpdateDetailedPrograms).not.toHaveBeenCalled()
    expect(bulkDelete3).not.toHaveBeenCalled()
  })

  it('does not split bulk-changes and rejects over 500', async () => {
    const { bulkChangeDetailedProgramsRemote } = await import('./detailed-programs-api-client')
    await expect(
      bulkChangeDetailedProgramsRemote({
        updates: Array.from({ length: 300 }, (_, i) => ({
          id: i + 1,
          nameKo: `N${i}`,
          useYn: true,
          version: 1,
        })),
        deleteItems: Array.from({ length: 201 }, (_, i) => ({
          id: i + 1000,
          version: 1,
        })),
      })
    ).rejects.toThrow('500')
    expect(customInstance).not.toHaveBeenCalled()
  })
})
