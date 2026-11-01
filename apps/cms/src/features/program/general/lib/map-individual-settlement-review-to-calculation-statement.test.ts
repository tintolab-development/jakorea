import { describe, expect, it } from 'vitest'
import type { IndividualSettlementReviewDetail } from '@/shared/api/generated/dashboard/schemas/individualSettlementReviewDetail'
import {
  mapIndividualSettlementItemKind,
  mapIndividualSettlementReviewToCalculationStatement,
} from './map-individual-settlement-review-to-calculation-statement'

const detail: IndividualSettlementReviewDetail = {
  settlementApplicationId: 11,
  programName: 'JA 경제교육',
  memberName: '홍길동',
  scheduleName: '2026-01-28 2회차',
  scheduleStartAt: '2026-01-28T00:00:00+09:00',
  status: 'SUBMITTED',
  latestRevisionNo: 1,
  revisions: [
    {
      revisionId: 1,
      revisionNo: 1,
      status: 'SUBMITTED',
      submittedAt: '2026-01-28T10:00:00+09:00',
      items: [
        {
          itemId: 1,
          itemType: 'TRANSPORT',
          itemName: '교통비',
          amount: 250000,
          evidenceRequired: true,
          description: '왕복',
          receipts: [],
        },
        {
          itemId: 2,
          itemType: 'WITHHOLDING',
          itemName: '원천징수',
          amount: 22000,
          evidenceRequired: false,
          description: '원천징수 8.8%',
          receipts: [],
        },
      ],
    },
  ],
}

describe('mapIndividualSettlementReviewToCalculationStatement', () => {
  it('1열은 프로그램명이고 기관명 필드로 채우지 않는다', () => {
    const view = mapIndividualSettlementReviewToCalculationStatement(detail)
    expect(view.basic.programName).toBe('JA 경제교육')
    expect(view.blocks[0]?.institutionName).toBe('JA 경제교육')
    expect(view.blocks[0]?.lectureSessionDisplay).toBe('2회차')
  })

  it('없는 강의비·사업기간·회차 진행은 - 이다', () => {
    const view = mapIndividualSettlementReviewToCalculationStatement(detail)
    expect(view.basic.businessPeriodDisplay).toBe('-')
    expect(view.basic.programSessionProgressDisplay).toBe('-')
    expect(view.basic.lectureFeeStandardTitle).toBe('-')
    expect(view.basic.businessIncomeEarnerLabel).toBe('-')
  })

  it('원천징수는 음수로 합산하고 수식에 뺀다', () => {
    const view = mapIndividualSettlementReviewToCalculationStatement(detail)
    expect(view.totalAmount).toBe(228000)
    expect(view.formulaLabel).toBe('교통비 - 원천징수')
    expect(mapIndividualSettlementItemKind('TRANSPORT')).toBe('travel')
    expect(mapIndividualSettlementItemKind('WITHHOLDING')).toBe('withholding')
  })
})
