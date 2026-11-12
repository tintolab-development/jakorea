import { describe, expect, it } from 'vitest'
import type { IndividualSettlementReviewDetail } from '@/shared/api/generated/dashboard/schemas/individualSettlementReviewDetail'
import type { IndividualSettlementReviewListItem } from '@/shared/api/generated/dashboard/schemas/individualSettlementReviewListItem'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import type { IndividualSettlementReviewListItemView } from '@/features/program/general/api/individual-settlement-review-types'
import {
  assignedSessionsForIndividualSettlementReview,
  isIndividualSettlementRowNotApplicable,
  mapIndividualSettlementReviewListRows,
  resolveIndividualSettlementReviewRowsForQueryState,
  resolveIndividualSettlementReviewSummaryLabel,
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

describe('resolveIndividualSettlementReviewSummaryLabel', () => {
  const empty = { submitted: 0, approved: 0, rejected: 0, total: 0 }

  it('matches the participant settlement summary wording', () => {
    expect(resolveIndividualSettlementReviewSummaryLabel(empty, true)).toBe('조회 실패')
    expect(resolveIndividualSettlementReviewSummaryLabel({ ...empty, submitted: 1, approved: 1, total: 2 }, false)).toBe('확인 진행 중')
    expect(resolveIndividualSettlementReviewSummaryLabel({ ...empty, submitted: 1, total: 1 }, false)).toBe('확인 대기 중')
    expect(resolveIndividualSettlementReviewSummaryLabel({ ...empty, rejected: 1, total: 1 }, false)).toBe('신청 반려')
    // 미신청만 있으면 '-' (기획 2026-11-12 2차 4-2)
    expect(resolveIndividualSettlementReviewSummaryLabel({ ...empty, total: 3 }, false)).toBe('-')
    expect(resolveIndividualSettlementReviewSummaryLabel(empty, false)).toBe('-')
  })
})

describe('참여 봉사자 정산 현황 — 서버 행(rowType) 그대로 쓰기', () => {
  const notApplied: IndividualSettlementReviewListItemView = {
    settlementApplicationId: null,
    programId: 186565,
    participantId: 1695107,
    programScheduleId: 187747,
    scheduleName: '기관 확정 2026-11-08',
    scheduleStartAt: '2026-11-08T14:10:00Z',
    scheduleEndAt: '2026-11-08T14:59:00Z',
    scheduleKind: 'EDUCATION',
    status: null,
    totalAmount: null,
    latestRevisionNo: null,
    applicationType: 'VOLUNTEER',
    volunteerApplicationId: 1691684,
    rowType: 'NOT_APPLIED',
    lectureProgressStatus: 'COMPLETED',
  }
  const applied: IndividualSettlementReviewListItemView = {
    settlementApplicationId: 31,
    programId: 186565,
    participantId: 1695107,
    programScheduleId: 187748,
    scheduleName: '사전 교육',
    scheduleStartAt: '2026-11-09T03:00:00Z',
    scheduleEndAt: '2026-11-09T04:00:00Z',
    scheduleKind: 'PRE_EDUCATION',
    status: 'SUBMITTED',
    totalAmount: 12_000,
    latestRevisionNo: 1,
    submittedAt: '2026-11-10T01:00:00Z',
    applicationType: 'VOLUNTEER',
    rowType: 'SETTLEMENT_APPLICATION',
    lectureProgressStatus: 'COMPLETED',
  }

  it('rowType이 있으면 배정 일정과 합치지 않고 서버 행 순서대로 1행씩 만든다', () => {
    const rows = resolveIndividualSettlementReviewRowsForQueryState({
      listReady: true,
      isError: false,
      assignedSessions: [{ resolvedScheduleId: 999 } as ParticipatingSchoolSession],
      applications: [applied, notApplied],
    })

    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({
      id: 'SETTLEMENT_APPLICATION:31',
      no: 1,
      educationScheduleLabel: '2026.11.09(월) | 12:00~13:00 | 사전교육',
      lectureProgress: 'completed',
      isNotApplied: false,
      settlementApplicationId: 31,
      status: 'SUBMITTED',
      totalAmount: 12_000,
      canOpenDetail: true,
    })
    expect(rows[1]).toMatchObject({
      id: 'NOT_APPLIED:187747',
      no: 2,
      educationScheduleLabel: '2026.11.08(일) | 23:10~23:59 | 기관 확정 2026-11-08',
      lectureProgress: 'completed',
      isNotApplied: true,
      settlementApplicationId: null,
      status: 'NONE',
      totalAmount: null,
      totalAmountLabel: '-',
      canOpenDetail: false,
    })
  })

  it('활동 포기 회차는 활동 포기로 표시한다', () => {
    const rows = resolveIndividualSettlementReviewRowsForQueryState({
      listReady: true,
      isError: false,
      assignedSessions: [],
      applications: [{ ...applied, lectureProgressStatus: 'GAVE_UP' }],
    })
    expect(rows[0]?.lectureProgress).toBe('activity_withdrawn')
  })

  it('rowType이 없는 응답(UJAT 등)은 기존처럼 배정 일정과 신청을 합친다', () => {
    const rows = resolveIndividualSettlementReviewRowsForQueryState({
      listReady: true,
      isError: false,
      assignedSessions: [],
      applications: [{ ...applied, rowType: null, lectureProgressStatus: null }],
    })
    expect(rows[0]).toMatchObject({ id: 'application:31', orphanApplication: true, isNotApplied: false })
  })
})

describe('isIndividualSettlementRowNotApplicable', () => {
  const base = { isNotApplied: false, settlementApplicationId: 31, lectureProgress: 'completed' as const }
  it('신청이 있고 진행 완료면 처리 현황·금액을 보여 준다', () => {
    expect(isIndividualSettlementRowNotApplicable(base)).toBe(false)
  })
  it('미신청·신청 없음·진행 예정 행은 "-" 대상이다', () => {
    expect(isIndividualSettlementRowNotApplicable({ ...base, isNotApplied: true })).toBe(true)
    expect(isIndividualSettlementRowNotApplicable({ ...base, settlementApplicationId: null })).toBe(true)
    expect(isIndividualSettlementRowNotApplicable({ ...base, lectureProgress: 'scheduled' })).toBe(true)
  })
})

describe('개인 정산 현황 행 정렬', () => {
  it('신청 여부와 무관하게 일정 시작 일시 최신순, 같으면 회차 번호 큰 순이다', () => {
    const rows = mapIndividualSettlementReviewListRows({
      assignedSessions: [
        { resolvedScheduleId: 1, sessionNo: 1, startAt: '2026-10-24T07:00:00Z' },
        { resolvedScheduleId: 2, sessionNo: 2, startAt: '2026-10-24T07:05:00Z' },
        { resolvedScheduleId: 3, sessionNo: 3, startAt: '2026-10-24T07:05:00Z' },
      ] as ParticipatingSchoolSession[],
      applications: [
        { settlementApplicationId: 50, programScheduleId: 2, status: 'SUBMITTED' },
        { settlementApplicationId: 60, programScheduleId: 99, scheduleStartAt: '2026-10-25T00:00:00Z', status: 'APPROVED' },
      ] as IndividualSettlementReviewListItemView[],
    })
    expect(rows.map(row => row.id)).toEqual([
      'application:60',
      'schedule:3',
      'schedule:2',
      'schedule:1',
    ])
    expect(rows.map(row => row.no)).toEqual([1, 2, 3, 4])
  })
})
