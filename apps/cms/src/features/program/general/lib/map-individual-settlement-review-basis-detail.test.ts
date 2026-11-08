import { describe, expect, it } from 'vitest'
import type { IndividualSettlementReviewItem } from '@/shared/api/generated/dashboard/schemas/individualSettlementReviewItem'
import { mapIndividualSettlementItemToBasisDetail } from './map-individual-settlement-review-basis-detail'
import { mapIndividualSettlementItemKind } from './map-individual-settlement-review-to-calculation-statement'

function mapItem(item: IndividualSettlementReviewItem) {
  return mapIndividualSettlementItemToBasisDetail(item, mapIndividualSettlementItemKind(item.itemType))
}

function transportItem(
  overrides: Partial<IndividualSettlementReviewItem> = {}
): IndividualSettlementReviewItem {
  return {
    itemId: 1,
    itemType: 'TRANSPORT',
    itemName: '교통비',
    amount: 50000,
    evidenceRequired: true,
    description: '편도 30km 이상 시 지급',
    receipts: [],
    ...overrides,
  }
}

describe('mapIndividualSettlementItemToBasisDetail', () => {
  it('제출 시점 편도 km 스냅샷을 그대로 싣고, 기존 건(null)은 null로 둔다', () => {
    const withSnapshot = mapItem(transportItem({ oneWayDistanceKm: 35 }))
    expect(withSnapshot).toMatchObject({ layout: 'transportOneWay', oneWayDistanceKm: 35 })

    const legacy = mapItem(transportItem())
    expect(legacy).toMatchObject({ layout: 'transportOneWay', oneWayDistanceKm: null })
  })

  it('가는 편·오는 편 영수증이면 왕복 교통비 모달이다', () => {
    const detail = mapItem(
      transportItem({
        receipts: [
          {
            receiptId: 1,
            revisionNo: 1,
            expenseType: 'TRANSPORT',
            expenseDate: '2026-01-28',
            amount: 25000,
            description: '가는 편',
            receiptStatus: 'SUBMITTED',
            files: [
              {
                fileObjectId: 11,
                fileName: '대중교통 이용 영수증.pdf',
                contentType: 'application/pdf',
              },
            ],
          },
          {
            receiptId: 2,
            revisionNo: 1,
            expenseType: 'TRANSPORT',
            expenseDate: '2026-01-28',
            amount: 25000,
            description: '오는 편',
            receiptStatus: 'SUBMITTED',
            files: [
              {
                fileObjectId: 12,
                fileName: '대중교통 이용 영수증.pdf',
                contentType: 'application/pdf',
              },
            ],
          },
        ],
      })
    )
    expect(detail).toMatchObject({
      layout: 'transportRoundTrip',
      totalWon: 50000,
      outbound: {
        categoryLabel: '참여자 교통비',
        publicTransit: {
          modeLabel: '-',
          amountWon: 25000,
          receiptFileName: '대중교통 이용 영수증.pdf',
          receiptFileObjectId: 11,
        },
      },
      inbound: {
        categoryLabel: '참여자 교통비',
        publicTransit: {
          modeLabel: '-',
          amountWon: 25000,
          receiptFileObjectId: 12,
        },
      },
    })
  })

  it('신청 메모(가는 편/오는 편)에 있는 교통수단만 표시하고 카탈로그 설명은 쓰지 않는다', () => {
    const catalogOnly = mapItem(transportItem())
    expect(catalogOnly).toMatchObject({
      layout: 'transportOneWay',
      trip: { publicTransit: { modeLabel: '-' } },
    })

    const withMemo = mapItem(
      transportItem({
        description:
          '왕복. 가는 편 기차(KTX·SRT·무궁화호 등) 25,000원 / 오는 편 버스(시내·시외·고속 등) 25,000원',
        receipts: [
          {
            receiptId: 1,
            revisionNo: 1,
            expenseType: 'TRANSPORT',
            expenseDate: '2026-01-28',
            amount: 25000,
            description: '가는 편',
            receiptStatus: 'SUBMITTED',
            files: [],
          },
          {
            receiptId: 2,
            revisionNo: 1,
            expenseType: 'TRANSPORT',
            expenseDate: '2026-01-28',
            amount: 25000,
            description: '오는 편',
            receiptStatus: 'SUBMITTED',
            files: [],
          },
        ],
      })
    )
    expect(withMemo).toMatchObject({
      layout: 'transportRoundTrip',
      outbound: { publicTransit: { modeLabel: '기차(KTX·SRT·무궁화호 등)' } },
      inbound: { publicTransit: { modeLabel: '버스(시내·시외·고속 등)' } },
    })
  })

  it('가는 편 영수증만 있으면 편도 교통비 모달이다', () => {
    const detail = mapItem(
      transportItem({
        amount: 25000,
        receipts: [
          {
            receiptId: 1,
            revisionNo: 1,
            expenseType: 'TRANSPORT',
            expenseDate: '2026-01-28',
            amount: 25000,
            description: '가는 편',
            receiptStatus: 'SUBMITTED',
            files: [],
          },
        ],
      })
    )
    expect(detail?.layout).toBe('transportOneWay')
  })

  it('식사비·숙박비·활동비는 영수증 금액·파일을 해당 레이아웃으로 연결한다', () => {
    expect(
      mapItem({
        itemId: 2,
        itemType: 'MEAL',
        itemName: '식사비',
        amount: 12000,
        evidenceRequired: true,
        description: null,
        receipts: [
          {
            receiptId: 3,
            revisionNo: 1,
            expenseType: 'MEAL',
            expenseDate: '2026-01-28',
            amount: 12000,
            description: null,
            receiptStatus: 'SUBMITTED',
            files: [{ fileObjectId: 21, fileName: '식사비.pdf', contentType: 'application/pdf' }],
          },
        ],
      })
    ).toMatchObject({
      layout: 'meal',
      categoryLabel: '식사비',
      totalWon: 12000,
      mealFee: { amountWon: 12000, receiptFileName: '식사비.pdf', receiptFileObjectId: 21 },
    })

    expect(
      mapItem({
        itemId: 3,
        itemType: 'LODGING',
        itemName: '숙박비',
        amount: 80000,
        evidenceRequired: true,
        receipts: [],
      })
    ).toMatchObject({
      layout: 'lodgingGeneral',
      nightsDisplay: '-',
      totalWon: 80000,
    })

    expect(
      mapItem({
        itemId: 4,
        itemType: 'ACTIVITY',
        itemName: '활동비',
        amount: 50000,
        evidenceRequired: true,
        receipts: [],
      })
    ).toMatchObject({
      layout: 'activity',
      categoryLabel: '참여자 활동비',
      totalWon: 50000,
    })
  })

  it('원천징수는 산정 필드를 만들지 않는다', () => {
    expect(
      mapItem({
        itemId: 5,
        itemType: 'WITHHOLDING',
        itemName: '원천징수',
        amount: 22000,
        evidenceRequired: false,
        receipts: [],
      })
    ).toBeUndefined()
  })
})
