import { beforeEach, describe, expect, it, vi } from 'vitest'

const { customInstanceMock } = vi.hoisted(() => ({
  customInstanceMock: vi.fn(),
}))

vi.mock('@/shared/api/orval-mutator', () => ({
  default: customInstanceMock,
  customInstance: customInstanceMock,
}))

import customInstance from '@/shared/api/orval-mutator'
import { participatingInstructorSettlementsQueryOptions } from '@/features/program/general/api/participating-instructor-settlements-remote'
import {
  approveIndividualSettlementReviewRemote,
  buildIndividualSettlementReviewListParams,
  fetchIndividualSettlementReviewDetailRemote,
  fetchIndividualSettlementReviewListRemote,
  INDIVIDUAL_SETTLEMENT_REVIEW_LIST_URL,
  individualSettlementReviewApproveUrl,
  individualSettlementReviewRejectUrl,
  isIndividualSettlementReviewConflict,
  rejectIndividualSettlementReviewRemote,
  unwrapIndividualSettlementReviewDetail,
} from './individual-settlement-review-remote'

describe('individual settlement review remote', () => {
  beforeEach(() => {
    vi.mocked(customInstance).mockReset()
  })

  it('builds list params with programId and participantId only', () => {
    const params = buildIndividualSettlementReviewListParams({
      programId: 186304,
      participantId: 1694942,
    })
    expect(params).toEqual({
      programId: 186304,
      participantId: 1694942,
      page: 0,
      size: 100,
    })
    expect(params && 'instructorMemberId' in params).toBe(false)
    expect(params && 'memberId' in params).toBe(false)
  })

  it('GETs list URL without instructorMemberId', async () => {
    vi.mocked(customInstance).mockResolvedValue({
      items: [
        {
          settlementApplicationId: 1,
          programId: 186304,
          individualApplicationId: 1694686,
          participantId: 1694942,
          programScheduleId: 187231,
          status: 'SUBMITTED',
          totalAmount: 49999,
          latestRevisionNo: 1,
        },
      ],
      page: 0,
      size: 100,
      totalElements: 1,
      totalPages: 1,
    })

    const items = await fetchIndividualSettlementReviewListRemote({
      programId: '186304',
      participantId: '1694942',
    })

    expect(customInstance).toHaveBeenCalledWith({
      url: INDIVIDUAL_SETTLEMENT_REVIEW_LIST_URL,
      method: 'GET',
      params: {
        programId: 186304,
        participantId: 1694942,
        page: 0,
        size: 100,
      },
    })
    const call = vi.mocked(customInstance).mock.calls[0]?.[0] as { params?: Record<string, unknown> }
    expect(call.params).not.toHaveProperty('instructorMemberId')
    expect(call.params).not.toHaveProperty('memberId')
    expect(items).toHaveLength(1)
    expect(items[0]?.settlementApplicationId).toBe(1)
    expect(items[0]?.totalAmount).toBe(49999)
  })

  it('unwraps detail ApiResponse.data', async () => {
    vi.mocked(customInstance).mockResolvedValue({
      success: true,
      data: {
        settlementApplicationId: 1,
        status: 'SUBMITTED',
        latestRevisionNo: 1,
        revisions: [],
      },
    })
    const detail = await fetchIndividualSettlementReviewDetailRemote(1)
    expect(detail.settlementApplicationId).toBe(1)
    expect(detail.latestRevisionNo).toBe(1)
    expect(unwrapIndividualSettlementReviewDetail({ success: true, data: { status: 'APPROVED' } }).status).toBe(
      'APPROVED'
    )
  })

  it('approves with expectedRevisionNo', async () => {
    vi.mocked(customInstance).mockResolvedValue({
      success: true,
      data: { settlementApplicationId: 1, revisionNo: 1, status: 'APPROVED' },
    })
    await approveIndividualSettlementReviewRemote({
      settlementApplicationId: 1,
      expectedRevisionNo: 1,
    })
    expect(customInstance).toHaveBeenCalledWith({
      url: individualSettlementReviewApproveUrl(1),
      method: 'PATCH',
      data: { expectedRevisionNo: 1 },
    })
  })

  it('rejects with expectedRevisionNo and trimmed reason', async () => {
    vi.mocked(customInstance).mockResolvedValue({
      success: true,
      data: { settlementApplicationId: 1, revisionNo: 1, status: 'REJECTED' },
    })
    await rejectIndividualSettlementReviewRemote({
      settlementApplicationId: 1,
      expectedRevisionNo: 1,
      reason: '  증빙 보완 필요  ',
    })
    expect(customInstance).toHaveBeenCalledWith({
      url: individualSettlementReviewRejectUrl(1),
      method: 'PATCH',
      data: { expectedRevisionNo: 1, reason: '증빙 보완 필요' },
    })
  })

  it('rejects with notificationType and scheduledNotificationAt', async () => {
    vi.mocked(customInstance).mockResolvedValue({
      success: true,
      data: { settlementApplicationId: 1, revisionNo: 1, status: 'REJECTED' },
    })
    await rejectIndividualSettlementReviewRemote({
      settlementApplicationId: 1,
      expectedRevisionNo: 1,
      reason: '증빙 보완 필요',
      notificationType: 'MANUAL',
      scheduledNotificationAt: '2026-03-09T09:15:00',
    })
    expect(customInstance).toHaveBeenCalledWith({
      url: individualSettlementReviewRejectUrl(1),
      method: 'PATCH',
      data: {
        expectedRevisionNo: 1,
        reason: '증빙 보완 필요',
        notificationType: 'MANUAL',
        scheduledNotificationAt: '2026-03-09T09:15:00',
      },
    })
  })

  it('treats HTTP 409 as review conflict', () => {
    expect(isIndividualSettlementReviewConflict({ response: { status: 409 } })).toBe(true)
    expect(isIndividualSettlementReviewConflict({ response: { status: 400 } })).toBe(false)
  })

  it('does not reuse instructor settlement query key for individual review', () => {
    const instructorKey = participatingInstructorSettlementsQueryOptions({
      programId: '186304',
      instructorMemberId: '190080',
    }).queryKey
    expect(instructorKey).toContain('instructor-settlements')
    expect(INDIVIDUAL_SETTLEMENT_REVIEW_LIST_URL).toBe('/api/admin/individual-settlement-applications')
    expect(INDIVIDUAL_SETTLEMENT_REVIEW_LIST_URL).not.toContain('/api/admin/settlements')
    expect(INDIVIDUAL_SETTLEMENT_REVIEW_LIST_URL).not.toContain('/participants/')
  })

  it('treats 200 empty items as empty list, not missing API', async () => {
    vi.mocked(customInstance).mockResolvedValue({
      items: [],
      page: 0,
      size: 100,
      totalElements: 0,
      totalPages: 0,
    })
    await expect(fetchIndividualSettlementReviewListRemote({ page: 0, size: 100 })).resolves.toEqual([])
  })
})
