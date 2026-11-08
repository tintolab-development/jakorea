import type { IndividualSettlementReviewItem } from '@/shared/api/generated/dashboard/schemas/individualSettlementReviewItem'
import type { IndividualSettlementReviewReceipt } from '@/shared/api/generated/dashboard/schemas/individualSettlementReviewReceipt'
import type { PaymentOrderCalculationLineKind } from '@/features/settlement-management/model/payment-order-admin-list'
import type { PaymentOrderCalculationBasisDetail } from '@/features/settlement/ui/payment-record/payment-order-calculation-basis-detail'

/** Platform 정산 작성 교통수단 라벨과 동일. CMS는 platform 패키지를 import하지 않는다. */
const SETTLEMENT_TRANSIT_LABELS = [
  '버스(시내·시외·고속 등)',
  '지하철',
  '기차(KTX·SRT·무궁화호 등)',
  '항공기',
  '기타',
] as const

function finiteAmount(value: number | null | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function firstFile(receipt: IndividualSettlementReviewReceipt | undefined) {
  const file = receipt?.files?.[0]
  if (!file) return undefined
  const fileName = file.fileName?.trim()
  if (!fileName) return undefined
  return {
    receiptFileName: fileName,
    receiptFileObjectId: file.fileObjectId,
  }
}

function findTransitLabel(text: string | null | undefined): string | undefined {
  const source = text ?? ''
  return SETTLEMENT_TRANSIT_LABELS.find(label => source.includes(label))
}

function textSegment(source: string, startMarker: string, endMarker?: string): string {
  const start = source.indexOf(startMarker)
  if (start < 0) return ''
  const from = start + startMarker.length
  if (!endMarker) return source.slice(from)
  const end = source.indexOf(endMarker, from)
  return source.slice(from, end < 0 ? source.length : end)
}

function transitLabelForLeg(
  receipt: IndividualSettlementReviewReceipt | undefined,
  itemDescription: string | null | undefined,
  leg: 'outbound' | 'inbound'
): string {
  const fromReceipt = findTransitLabel(receipt?.description)
  if (fromReceipt) return fromReceipt

  const itemText = itemDescription ?? ''
  const hasTripMemo = itemText.includes('가는 편') || itemText.includes('오는 편')
  if (!hasTripMemo) return '-'

  const segment =
    leg === 'outbound'
      ? textSegment(itemText, '가는 편', '오는 편')
      : textSegment(itemText, '오는 편')
  return findTransitLabel(segment) ?? findTransitLabel(itemText) ?? '-'
}

function isOutboundReceipt(receipt: IndividualSettlementReviewReceipt): boolean {
  return (receipt.description ?? '').includes('가는')
}

function isInboundReceipt(receipt: IndividualSettlementReviewReceipt): boolean {
  return (receipt.description ?? '').includes('오는')
}

function participantTravelCategoryLabel(itemName: string): string {
  const name = itemName.trim() || '교통비'
  if (name.includes('참여자') || name.includes('학생')) return name
  if (name.includes('교통')) return '참여자 교통비'
  return name
}

function activityCategoryLabel(itemName: string): string {
  const name = itemName.trim() || '활동비'
  if (name.includes('참여자')) return name
  if (name.includes('활동')) return '참여자 활동비'
  return name
}

function travelLeg(
  item: IndividualSettlementReviewItem,
  receipt: IndividualSettlementReviewReceipt | undefined,
  leg: 'outbound' | 'inbound',
  amountWon: number
) {
  return {
    categoryLabel: participantTravelCategoryLabel(item.itemName),
    publicTransit: {
      modeLabel: transitLabelForLeg(receipt, item.description, leg),
      amountWon,
      ...firstFile(receipt),
    },
  }
}

function mapTravelBasisDetail(
  item: IndividualSettlementReviewItem
): PaymentOrderCalculationBasisDetail {
  const receipts = item.receipts ?? []
  /** 제출 시점 편도 km 스냅샷만 사용 — 관리자 화면에서 재계산·목록 preview로 덮지 않는다. */
  const oneWayDistanceKm = item.oneWayDistanceKm ?? null
  const outboundReceipt = receipts.find(isOutboundReceipt)
  const inboundReceipt = receipts.find(isInboundReceipt)

  if (outboundReceipt && inboundReceipt) {
    const outbound = travelLeg(item, outboundReceipt, 'outbound', finiteAmount(outboundReceipt.amount))
    const inbound = travelLeg(item, inboundReceipt, 'inbound', finiteAmount(inboundReceipt.amount))
    return {
      layout: 'transportRoundTrip',
      outbound,
      inbound,
      totalWon: outbound.publicTransit.amountWon + inbound.publicTransit.amountWon,
      oneWayDistanceKm,
    }
  }

  if (outboundReceipt || inboundReceipt) {
    const receipt = outboundReceipt ?? inboundReceipt
    const leg = outboundReceipt ? 'outbound' : 'inbound'
    return {
      layout: 'transportOneWay',
      trip: travelLeg(item, receipt, leg, finiteAmount(receipt?.amount)),
      oneWayDistanceKm,
    }
  }

  if (receipts.length >= 2) {
    const outbound = travelLeg(item, receipts[0], 'outbound', finiteAmount(receipts[0]?.amount))
    const inbound = travelLeg(item, receipts[1], 'inbound', finiteAmount(receipts[1]?.amount))
    return {
      layout: 'transportRoundTrip',
      outbound,
      inbound,
      totalWon: outbound.publicTransit.amountWon + inbound.publicTransit.amountWon,
      oneWayDistanceKm,
    }
  }

  const receipt = receipts[0]
  return {
    layout: 'transportOneWay',
    trip: travelLeg(item, receipt, 'outbound', finiteAmount(receipt?.amount ?? item.amount)),
    oneWayDistanceKm,
  }
}

function receiptFee(item: IndividualSettlementReviewItem) {
  const receipt = item.receipts?.[0]
  return {
    amountWon: finiteAmount(receipt?.amount ?? item.amount),
    ...firstFile(receipt),
  }
}

export function mapIndividualSettlementItemToBasisDetail(
  item: IndividualSettlementReviewItem,
  kind: PaymentOrderCalculationLineKind
): PaymentOrderCalculationBasisDetail | undefined {
  if (kind === 'travel') return mapTravelBasisDetail(item)
  if (kind === 'lodging') {
    const lodgingFee = receiptFee(item)
    return {
      layout: 'lodgingGeneral',
      categoryLabel: item.itemName.trim() || '숙박비',
      nightsDisplay: '-',
      lodgingFee,
      totalWon: lodgingFee.amountWon,
    }
  }
  if (kind === 'meal') {
    const mealFee = receiptFee(item)
    return {
      layout: 'meal',
      categoryLabel: item.itemName.trim() || '식사비',
      mealFee,
      totalWon: mealFee.amountWon,
    }
  }
  if (kind === 'activity') {
    const activityFee = receiptFee(item)
    return {
      layout: 'activity',
      categoryLabel: activityCategoryLabel(item.itemName),
      activityFee,
      totalWon: activityFee.amountWon,
    }
  }
  return undefined
}
