import { beforeEach, describe, expect, it, vi } from 'vitest'

const { customInstance } = vi.hoisted(() => ({ customInstance: vi.fn() }))

vi.mock('@/shared/api/orval-mutator', () => ({ customInstance }))
vi.mock('@/entities/user/api/auth-service', () => ({ hasRemoteAdminJwt: () => true }))
vi.mock('@/shared/config/real-api-modules', () => ({ isRealApiModuleEnabled: () => true }))

import {
  approveIndividualSettlementReviewRemote,
  fetchIndividualSettlementReviewListRemote,
  rejectIndividualSettlementReviewRemote,
} from './individual-settlement-review-remote'

describe('individual settlement review remote', () => {
  beforeEach(() => customInstance.mockReset())

  it('queries the individual review API by program and participant, not instructor member id', async () => {
    customInstance.mockResolvedValueOnce({
      items: [{ settlementApplicationId: 1, participantId: 1694686, programScheduleId: 187231 }],
      page: 0,
      size: 100,
      totalElements: 1,
      totalPages: 1,
    })

    await expect(
      fetchIndividualSettlementReviewListRemote({ programId: 186339, participantId: 1694686 })
    ).resolves.toHaveLength(1)
    expect(customInstance).toHaveBeenCalledWith({
      url: '/api/admin/individual-settlement-applications',
      method: 'GET',
      params: { programId: 186339, participantId: 1694686, page: 0, size: 100 },
    })
  })

  it('keeps approval and rejection ids separate from settlement ledger ids', async () => {
    customInstance
      .mockResolvedValueOnce({ success: true, data: { settlementApplicationId: 1, status: 'APPROVED' } })
      .mockResolvedValueOnce({ success: true, data: { settlementApplicationId: 1, status: 'REJECTED' } })

    await approveIndividualSettlementReviewRemote(1, 1)
    await rejectIndividualSettlementReviewRemote(1, { expectedRevisionNo: 2, reason: '증빙 보완' })

    expect(customInstance.mock.calls[0]?.[0]).toMatchObject({
      url: '/api/admin/individual-settlement-applications/1/approve',
      method: 'PATCH',
      data: { expectedRevisionNo: 1 },
    })
    expect(customInstance.mock.calls[1]?.[0]).toMatchObject({
      url: '/api/admin/individual-settlement-applications/1/reject',
      method: 'PATCH',
      data: { expectedRevisionNo: 2, reason: '증빙 보완' },
    })
  })
})
