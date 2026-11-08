import { describe, expect, it } from 'vitest'
import type { IndividualSettlementReviewDetail } from '@/shared/api/generated/dashboard/schemas/individualSettlementReviewDetail'
import type { IndividualSettlementReviewListItem } from '@/shared/api/generated/dashboard/schemas/individualSettlementReviewListItem'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import {
  assignedSessionsForIndividualSettlementReview,
  mapIndividualSettlementReviewListRows,
  resolveIndividualSettlementReviewRowsForQueryState,
} from './map-individual-settlement-review-rows'
import {
  canReviewIndividualSettlement,
  flattenIndividualSettlementReviewReceipts,
  formatIndividualSettlementWon,
  INDIVIDUAL_SETTLEMENT_LODGING_NOT_PAYABLE_LABEL,
  individualSettlementReviewStatusLabel,
  individualSettlementTableProcessingLabel,
  isIndividualSettlementLodgingType,
  latestIndividualSettlementReviewRevision,
} from './individual-settlement-review-status'

function session(
  scheduleId: number | null,
  overrides: Partial<ParticipatingSchoolSession> = {}
): ParticipatingSchoolSession {
  return {
    round: 1,
    date: '2026.10.01',
    dayOfWeek: '목',
    duration: '60분',
    format: '오프라인',
    classNum: '1회차',
    timeRange: '10:00 ~ 11:00',
    resolvedScheduleId: scheduleId,
    ...overrides,
  }
}

const submittedApplication: IndividualSettlementReviewListItem = {
  settlementApplicationId: 1,
  programId: 186304,
  individualApplicationId: 1694686,
  participantId: 1694942,
  programScheduleId: 187231,
  scheduleName: '1회차',
  latestRevisionNo: 1,
  status: 'SUBMITTED',
  totalAmount: 49999,
  submittedAt: '2026-10-02T00:00:00Z',
  reviewedAt: null,
  rejected: false,
  rejectionReason: null,
}

const reviewDetail: IndividualSettlementReviewDetail = {
  settlementApplicationId: 1,
  programId: 186304,
  programName: '프로그램명',
  individualApplicationId: 1694686,
  participantId: 1694942,
  programScheduleId: 187231,
  scheduleName: '1회차',
  status: 'SUBMITTED',
  latestRevisionNo: 1,
  availableActions: ['APPROVE', 'REJECT'],
  revisions: [
    {
      revisionId: 10,
      revisionNo: 1,
      status: 'SUBMITTED',
      rejectionReason: null,
      submittedAt: '2026-10-02T00:00:00Z',
      reviewedAt: null,
      reviewedByAdminId: null,
      items: [
        {
          itemId: 20,
          itemType: 'ACTIVITY',
          itemName: '활동비',
          amount: 20000,
          evidenceRequired: true,
          description: null,
          receipts: [
            {
              receiptId: 1,
              originalReceiptId: null,
              revisionNo: 1,
              expenseType: 'OTHER',
              expenseDate: '2026-10-01',
              amount: 20000,
              description: null,
              receiptStatus: 'SUBMITTED',
              files: [
                {
                  fileObjectId: 100,
                  fileName: 'receipt-1.jpg',
                  contentType: 'image/jpeg',
                  fileSize: 12345,
                },
              ],
            },
          ],
        },
        {
          itemId: 21,
          itemType: 'LODGING',
          itemName: '숙박비',
          amount: 19999,
          evidenceRequired: true,
          receipts: [
            {
              receiptId: 2,
              originalReceiptId: null,
              revisionNo: 1,
              expenseType: 'LODGING',
              expenseDate: '2026-10-01',
              amount: 19999,
              receiptStatus: 'SUBMITTED',
              files: [{ fileObjectId: 101, fileName: 'receipt-2.jpg', contentType: 'image/jpeg' }],
            },
          ],
        },
        {
          itemId: 22,
          itemType: 'MEAL',
          itemName: '식비',
          amount: 10000,
          evidenceRequired: true,
          receipts: [
            {
              receiptId: 3,
              originalReceiptId: null,
              revisionNo: 1,
              expenseType: 'MEAL',
              expenseDate: '2026-10-01',
              amount: 10000,
              receiptStatus: 'SUBMITTED',
              files: [
                { fileObjectId: 102, fileName: 'receipt-3.pdf', contentType: 'application/pdf' },
              ],
            },
          ],
        },
      ],
    },
  ],
}

describe('mapIndividualSettlementReviewListRows', () => {
  it('keeps unsubmitted assigned schedules as 해당 없음 and maps SUBMITTED amount', () => {
    const rows = mapIndividualSettlementReviewListRows({
      assignedSessions: [session(187231), session(187232)],
      applications: [submittedApplication],
    })
    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({
      programScheduleId: 187231,
      lectureProgress: 'scheduled',
      status: 'SUBMITTED',
      statusLabel: '확인 대기 중',
      totalAmount: 49999,
      totalAmountLabel: '49,999원',
      latestRevisionNo: 1,
      settlementApplicationId: 1,
      canOpenDetail: true,
    })
    expect(rows[1]).toMatchObject({
      programScheduleId: 187232,
      lectureProgress: 'scheduled',
      status: 'NONE',
      statusLabel: '해당 없음',
      totalAmount: null,
      totalAmountLabel: '-',
      canOpenDetail: false,
      settlementApplicationId: null,
    })
    expect(rows.every(row => !('settlementId' in row))).toBe(true)
  })

  it('does not use requestedScheduleId as programScheduleId', () => {
    const rows = mapIndividualSettlementReviewListRows({
      assignedSessions: [
        session(null, { requestedScheduleId: 999001, scheduleUnresolved: true }),
        session(187231),
      ],
      applications: [submittedApplication],
    })
    expect(
      assignedSessionsForIndividualSettlementReview([
        session(null, { requestedScheduleId: 999001, scheduleUnresolved: true }),
        session(187231),
      ]).map(item => item.resolvedScheduleId)
    ).toEqual([187231])
    expect(rows.map(row => row.programScheduleId)).toEqual([187231])
  })

  it('keeps applications that are missing from assigned sessions', () => {
    const rows = mapIndividualSettlementReviewListRows({
      assignedSessions: [session(187230)],
      applications: [submittedApplication],
    })
    expect(rows).toHaveLength(2)
    expect(rows[0]?.statusLabel).toBe('해당 없음')
    expect(rows[1]).toMatchObject({
      settlementApplicationId: 1,
      orphanApplication: true,
      statusLabel: '확인 대기 중',
    })
  })

  it('does not invent 미신청 rows from an empty error-like input set', () => {
    expect(
      mapIndividualSettlementReviewListRows({
        assignedSessions: [],
        applications: [],
      })
    ).toEqual([])
  })

  it('does not fill 미신청 when list query failed or is not ready', () => {
    const assigned = [session(187231), session(187232)]
    expect(
      resolveIndividualSettlementReviewRowsForQueryState({
        listReady: false,
        isError: true,
        assignedSessions: assigned,
        applications: [],
      })
    ).toEqual([])
    expect(
      resolveIndividualSettlementReviewRowsForQueryState({
        listReady: false,
        isError: false,
        assignedSessions: assigned,
        applications: [],
      })
    ).toEqual([])
  })
})

describe('individual settlement review detail display', () => {
  it('formats 49,999원 and three receipt original filenames', () => {
    expect(formatIndividualSettlementWon(49999)).toBe('49,999원')
    const receipts = flattenIndividualSettlementReviewReceipts(reviewDetail)
    expect(receipts).toHaveLength(3)
    expect(receipts.map(receipt => receipt.files[0]?.fileName)).toEqual([
      'receipt-1.jpg',
      'receipt-2.jpg',
      'receipt-3.pdf',
    ])
    expect(latestIndividualSettlementReviewRevision(reviewDetail)?.revisionNo).toBe(1)
    expect(canReviewIndividualSettlement(reviewDetail)).toBe(true)
  })

  it('hides review actions for WITHDRAWN and DRAFT and shows them as 해당 없음', () => {
    expect(individualSettlementReviewStatusLabel('WITHDRAWN')).toBe('해당 없음')
    expect(individualSettlementReviewStatusLabel('DRAFT')).toBe('해당 없음')
    expect(
      canReviewIndividualSettlement({
        ...reviewDetail,
        status: 'WITHDRAWN',
        availableActions: [],
        revisions: [{ ...reviewDetail.revisions![0]!, status: 'WITHDRAWN' }],
      })
    ).toBe(false)
  })

  it('maps completed delivery status to 진행 완료', () => {
    const rows = mapIndividualSettlementReviewListRows({
      assignedSessions: [
        session(187231, { status: 'completed', deliveryScheduleStatus: 'COMPLETED' }),
      ],
      applications: [submittedApplication],
    })
    expect(rows[0]?.lectureProgress).toBe('completed')
  })

  it('shows 해당 없음 for unsubmitted processing status', () => {
    expect(individualSettlementTableProcessingLabel('NONE')).toBe('해당 없음')
    expect(individualSettlementTableProcessingLabel('SUBMITTED')).toBe('확인 대기 중')
  })

  it('shows APPROVED as 지급조서 확인 완료 and PAID as 계좌 지급 완료', () => {
    expect(individualSettlementReviewStatusLabel('APPROVED')).toBe('지급조서 확인 완료')
    expect(individualSettlementReviewStatusLabel('REJECTED')).toBe('신청 반려')
    expect(individualSettlementReviewStatusLabel('NONE')).toBe('해당 없음')
    expect(individualSettlementReviewStatusLabel('PAID')).toBe('계좌 지급 완료')
  })

  it('keeps LODGING visible as not payable and not an instructor statement id', () => {
    const lodging = reviewDetail.revisions?.[0]?.items.find(item => item.itemType === 'LODGING')
    expect(lodging?.amount).toBe(19999)
    expect(isIndividualSettlementLodgingType(lodging?.itemType)).toBe(true)
    expect(INDIVIDUAL_SETTLEMENT_LODGING_NOT_PAYABLE_LABEL).toBe('지급 대상 아님')
    expect(reviewDetail.settlementApplicationId).toBe(1)
    expect('settlementId' in reviewDetail).toBe(false)
  })

  it('shows rejection reason from latest revision', () => {
    const rejected: IndividualSettlementReviewDetail = {
      ...reviewDetail,
      status: 'REJECTED',
      availableActions: [],
      revisions: [
        {
          ...reviewDetail.revisions![0]!,
          status: 'REJECTED',
          rejectionReason: '증빙 보완 필요',
        },
      ],
    }
    expect(latestIndividualSettlementReviewRevision(rejected)?.rejectionReason).toBe(
      '증빙 보완 필요'
    )
    expect(canReviewIndividualSettlement(rejected)).toBe(false)
  })
})
