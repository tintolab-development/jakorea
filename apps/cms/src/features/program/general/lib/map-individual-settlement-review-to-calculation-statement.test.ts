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
          description: '편도 30km 이상 시 지급',
          receipts: [
            {
              receiptId: 1,
              revisionNo: 1,
              expenseType: 'TRANSPORT',
              expenseDate: '2026-01-28',
              amount: 125000,
              description: '가는 편',
              receiptStatus: 'SUBMITTED',
              files: [],
            },
          ],
        },
        {
          itemId: 2,
          itemType: 'WITHHOLDING',
          itemName: '원천징수',
          amount: 22000,
          evidenceRequired: false,
          description: '소득 유형별 원천징수 기준과 세율을 설정합니다.',
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

  it('리뷰 상세에 없는 강의비·사업기간·회차 진행은 - 이다', () => {
    const view = mapIndividualSettlementReviewToCalculationStatement(detail)
    expect(view.basic.businessPeriodDisplay).toBe('-')
    expect(view.basic.programSessionProgressDisplay).toBe('-')
    expect(view.basic.lectureFeeStandardTitle).toBe('-')
    expect(view.basic.businessIncomeEarnerLabel).toBe('-')
  })

  it('프로그램 진행 회차·사업 운영 기간 extras를 쓴다', () => {
    const view = mapIndividualSettlementReviewToCalculationStatement(detail, {
      programSessionProgressDisplay: '3 / 8',
      businessPeriodDisplay: '2026.01.01(목) ~ 2026.12.31(목)',
    })
    expect(view.basic.programSessionProgressDisplay).toBe('3 / 8')
    expect(view.basic.businessPeriodDisplay).toBe('2026.01.01(목) ~ 2026.12.31(목)')
  })

  it('항목 설명은 items[].description만 쓰고 receipts 메모는 쓰지 않는다', () => {
    const view = mapIndividualSettlementReviewToCalculationStatement(detail)
    expect(view.blocks[0]?.lines[0]?.description).toBe('편도 30km 이상 시 지급')
    expect(view.blocks[0]?.lines[0]?.description).not.toContain('가는 편')
    expect(view.receiptsByItemId['1']?.[0]?.description).toBe('가는 편')
    expect(view.blocks[0]?.lines[1]?.description).toBe(
      '소득 유형별 원천징수 기준과 세율을 설정합니다.'
    )
  })

  it('items[].description이 null이거나 공백이면 - 이다', () => {
    const emptyDescription: IndividualSettlementReviewDetail = {
      ...detail,
      revisions: [
        {
          ...detail.revisions![0]!,
          items: [
            {
              itemId: 1,
              itemType: 'TRANSPORT',
              itemName: '교통비',
              amount: 1000,
              evidenceRequired: true,
              description: null,
              receipts: [],
            },
            {
              itemId: 2,
              itemType: 'MEAL',
              itemName: '식사비',
              amount: 2000,
              evidenceRequired: false,
              description: '   ',
              receipts: [],
            },
          ],
        },
      ],
    }
    const view = mapIndividualSettlementReviewToCalculationStatement(emptyDescription)
    expect(view.blocks[0]?.lines[0]?.description).toBe('-')
    expect(view.blocks[0]?.lines[1]?.description).toBe('-')
  })

  it('원천징수는 음수로 합산하고 수식에 뺀다', () => {
    const view = mapIndividualSettlementReviewToCalculationStatement(detail)
    expect(view.totalAmount).toBe(228000)
    expect(view.formulaLabel).toBe('교통비 - 원천징수')
    expect(mapIndividualSettlementItemKind('TRANSPORT')).toBe('travel')
    expect(mapIndividualSettlementItemKind('WITHHOLDING')).toBe('withholding')
  })
})
