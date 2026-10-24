import { describe, expect, it } from 'vitest'
import { mapIndividualSettlementReviewRows } from './map-individual-settlement-review-rows'

describe('mapIndividualSettlementReviewRows', () => {
  it('keeps assigned schedules without an application and overlays submitted review data', () => {
    const rows = mapIndividualSettlementReviewRows({
      sessions: [
        {
          round: 1,
          date: '2026.10.01',
          dayOfWeek: '목',
          duration: '60분',
          format: '오프라인',
          classNum: '1교시',
          timeRange: '10:00 ~ 11:00',
          resolvedScheduleId: 187231,
          startAt: '2026-10-01T10:00:00Z',
        },
        {
          round: 2,
          date: '2026.10.08',
          dayOfWeek: '목',
          duration: '60분',
          format: '오프라인',
          classNum: '2교시',
          timeRange: '10:00 ~ 11:00',
          resolvedScheduleId: 187232,
          startAt: '2026-10-08T10:00:00Z',
        },
      ],
      reviews: [
        {
          settlementApplicationId: 1,
          programId: 186339,
          individualApplicationId: 1694686,
          participantId: 1,
          memberId: 2,
          programScheduleId: 187231,
          scheduleName: '1회차',
          scheduleStartAt: '2026-10-01T10:00:00Z',
          scheduleEndAt: '2026-10-01T11:00:00Z',
          latestRevisionNo: 1,
          status: 'SUBMITTED',
          totalAmount: 49999,
          submittedAt: '2026-10-02T00:00:00Z',
          rejected: false,
          rejectionReason: null,
        },
      ],
    })

    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({
      scheduleId: 187231,
      status: 'SUBMITTED',
      settlementApplicationId: 1,
      totalAmount: 49999,
      latestRevisionNo: 1,
    })
    expect(rows[1]).toMatchObject({
      scheduleId: 187232,
      status: 'NOT_SUBMITTED',
      totalAmount: null,
    })
  })

  it('does not treat a requested schedule id as a program schedule id', () => {
    const rows = mapIndividualSettlementReviewRows({
      sessions: [
        {
          round: 1,
          date: '-',
          dayOfWeek: '-',
          duration: '-',
          format: '-',
          classNum: '1지망',
          timeRange: '-',
          requestedScheduleId: 9001,
          resolvedScheduleId: null,
        },
      ],
    })

    expect(rows).toEqual([])
  })
})
